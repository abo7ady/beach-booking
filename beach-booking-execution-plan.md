# 🏖️ Beach Travel Booking Platform — Complete Execution Plan

> **Stack:** Next.js 14 (App Router) · Node/Express · MongoDB Atlas · Mongoose · JWT · Cloudinary · Twilio/SMS

---

## PART 1 — MONGODB MONGOOSE SCHEMAS

### 1.1 User Model `/backend/src/models/User.js`

```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,          // Never returned in queries by default
    },
    name: { type: String, trim: true, default: '' },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,         // Set to true after OTP verification at registration
    },
    // ── Alternative contact handles (stored without @ or +)
    telegram:  { type: String, trim: true, default: '' },
    instagram: { type: String, trim: true, default: '' },
    snapchat:  { type: String, trim: true, default: '' },
    messenger: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method for login comparison
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
```

> **Auth model:** Users register with phone + password. OTP via SMS is used **only**
> for (1) verifying the phone number at first registration, and (2) resetting a
> forgotten password. Regular logins never touch the SMS gateway.
> `isPhoneVerified: false` acts as a gate — unverified accounts cannot log in.

---

### 1.2 Activity Model `/backend/src/models/Activity.js`

```javascript
import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    images:      [{ type: String }],          // Cloudinary secure URLs
    price:       { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, default: 60 },
    tags:        [{ type: String }],          // e.g. ['ATV', 'Parachute']

    // ── Popularity system
    popularityScore: {
      type: Number,
      default: 0,
      index: true,                            // Fast DESC sort on catalog
    },
    isTrending: { type: Boolean, default: false }, // Computed + persisted

    isActive: { type: Boolean, default: true },  // Soft-delete flag
  },
  { timestamps: true }
);

// Catalog query: active activities sorted by score
activitySchema.index({ isActive: 1, popularityScore: -1 });

export default mongoose.model('Activity', activitySchema);
```

> **Trending Rule:** After every booking status change, a background job
> (or inline logic) flags the **top 3 activities by score** as `isTrending: true`
> and clears the rest. This avoids recomputing on every GET request.

---

### 1.3 Booking Model `/backend/src/models/Booking.js`

```javascript
import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    status:    { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note:      { type: String, default: '' },
  },
  { timestamps: true, _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true, index: true },
    activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true, index: true },
    desiredDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Confirmed', 'Cancelled'],
      default: 'New',
      index: true,
    },
    adminNote:     { type: String, default: '' },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

// Admin queue: group by status, newest first
bookingSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Booking', bookingSchema);
```

---

### 1.4 Favorite Model `/backend/src/models/Favorite.js`

```javascript
import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  },
  { timestamps: true }
);

// Ensures one user can favorite an activity exactly once
favoriteSchema.index({ user: 1, activity: 1 }, { unique: true });

export default mongoose.model('Favorite', favoriteSchema);
```

---

### 1.5 OTP Model `/backend/src/models/Otp.js` — TTL Auto-Expiry

```javascript
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  phone:     { type: String, required: true, index: true },
  hashedOtp: { type: String, required: true },
  attempts:  { type: Number, default: 0 },    // Max 3 wrong guesses

  // ✅ MongoDB TTL index — document auto-deleted after 180 seconds
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 180,
  },
});

export default mongoose.model('Otp', otpSchema);
```

> **OTP is now scoped to two flows only:**
> 1. **Registration** — sent after the user submits phone + password. Account is created but locked (`isPhoneVerified: false`) until the code is confirmed.
> 2. **Forgot Password** — sent to a verified phone. On verify, a short-lived `resetToken` is returned; the client uses it to call `/auth/reset-password`.
>
> The `purpose` field (`'registration' | 'reset'`) prevents cross-use of the same code between the two flows.
> OTP is **bcrypt-hashed** before storage. On 3 failed attempts the document is deleted. Rate-limited to 1 request/60s per phone.

---

## PART 2 — REST API ARCHITECTURE

### Base URL: `/api/v1`
### Auth: `Authorization: Bearer <JWT>` on protected routes

---

### 2.1 Auth Endpoints

| Method | Path                        | Protection | Purpose                                          |
|--------|-----------------------------|------------|--------------------------------------------------|
| POST   | `/auth/register`            | Public     | Step 1: phone + password → send OTP             |
| POST   | `/auth/register/verify`     | Public     | Step 2: verify OTP → activate account + JWT     |
| POST   | `/auth/login`               | Public     | phone + password → JWT (no OTP involved)        |
| POST   | `/auth/forgot-password`     | Public     | Send reset OTP to verified phone                |
| POST   | `/auth/reset-password/verify`| Public    | Verify reset OTP → get short-lived reset token  |
| POST   | `/auth/reset-password`      | Public     | Use reset token → set new password              |
| POST   | `/auth/admin-login`         | Public     | Admin env-secret → JWT                          |

---

#### Registration — 2-Step Flow

```
[Client]  POST /auth/register        { phone, password, name? }
[Server]  → validates phone not already registered
          → creates User { phone, password, name, isPhoneVerified: false }
          → generates & sends OTP via SMS
          → returns { success: true, expiresIn: 180 }

[Client]  POST /auth/register/verify { phone, otp }
[Server]  → verifies OTP (same logic as before)
          → sets user.isPhoneVerified = true
          → returns { token, user }   ← account is now active
```

**`/auth/register` Controller:**
```javascript
export const register = async (req, res) => {
  const { phone, password, name } = req.body;

  // 1. Validate inputs
  if (!isValidPhone(phone))
    return res.status(400).json({ error: 'Invalid phone number format' });
  if (!password || password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  // 2. Check phone not already taken by a verified account
  const existing = await User.findOne({ phone });
  if (existing?.isPhoneVerified)
    return res.status(409).json({ error: 'Phone number already registered. Please log in.' });

  // 3. Create user (or overwrite a stale unverified account)
  if (existing && !existing.isPhoneVerified) {
    existing.password = password; // will be re-hashed by pre-save hook
    existing.name = name || existing.name;
    await existing.save();
  } else {
    await User.create({ phone, password, name: name || '' });
  }

  // 4. Send OTP
  await sendOtp(phone, 'registration');  // shared helper (see below)

  return res.status(201).json({ success: true, expiresIn: 180 });
};
```

**`/auth/register/verify` Controller:**
```javascript
export const verifyRegistration = async (req, res) => {
  const { phone, otp } = req.body;

  // 1. Verify OTP (purpose: 'registration')
  await consumeOtp(phone, otp, 'registration'); // throws on failure

  // 2. Activate account
  const user = await User.findOneAndUpdate(
    { phone },
    { isPhoneVerified: true },
    { new: true }
  );

  // 3. Issue JWT
  const token = signToken(user);
  return res.json({ token, user });
};
```

---

#### Login — Direct (No OTP)

```
[Client]  POST /auth/login  { phone, password }
[Server]  → finds user by phone
          → checks isPhoneVerified
          → bcrypt.compare(password, user.password)
          → returns { token, user }
```

**`/auth/login` Controller:**
```javascript
export const login = async (req, res) => {
  const { phone, password } = req.body;

  // 1. Find user — explicitly select password (it's select: false)
  const user = await User.findOne({ phone }).select('+password');
  if (!user)
    return res.status(401).json({ error: 'Invalid phone number or password' });

  // 2. Block unverified accounts (registered but OTP not confirmed yet)
  if (!user.isPhoneVerified)
    return res.status(403).json({
      error: 'Phone not verified. Please complete registration.',
      action: 'verify_registration',  // Frontend uses this to redirect to OTP step
    });

  // 3. Password check
  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    return res.status(401).json({ error: 'Invalid phone number or password' });

  // 4. Issue JWT
  const token = signToken(user);
  return res.json({ token, user });
};
```

---

#### Forgot Password — 3-Step Flow

```
[Client]  POST /auth/forgot-password           { phone }
[Server]  → checks phone exists & is verified
          → sends OTP via SMS (purpose: 'reset')
          → returns { success: true, expiresIn: 180 }

[Client]  POST /auth/reset-password/verify     { phone, otp }
[Server]  → verifies OTP
          → generates a short-lived resetToken (crypto random, 15-min TTL)
          → stores hashed resetToken on user document
          → returns { resetToken }   ← one-time-use, passed to next step

[Client]  POST /auth/reset-password            { phone, resetToken, newPassword }
[Server]  → verifies resetToken matches & not expired
          → sets user.password = newPassword (pre-save hook hashes it)
          → clears resetToken fields
          → returns { token, user }  ← auto-login after reset
```

**User schema additions for reset token:**
```javascript
// Add to userSchema fields:
passwordResetToken:   { type: String, select: false },
passwordResetExpires: { type: Date,   select: false },
```

**`/auth/forgot-password` Controller:**
```javascript
export const forgotPassword = async (req, res) => {
  const { phone } = req.body;

  const user = await User.findOne({ phone, isPhoneVerified: true });
  // Always return 200 to prevent phone enumeration attacks
  if (!user) return res.json({ success: true, expiresIn: 180 });

  await sendOtp(phone, 'reset');
  return res.json({ success: true, expiresIn: 180 });
};
```

**`/auth/reset-password/verify` Controller:**
```javascript
export const verifyResetOtp = async (req, res) => {
  const { phone, otp } = req.body;

  await consumeOtp(phone, otp, 'reset'); // throws on failure

  // Generate a 32-byte random reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  await User.findOneAndUpdate(
    { phone },
    {
      passwordResetToken:   hashedToken,
      passwordResetExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
    }
  );

  // Return the PLAIN token to client (we store the hash, not the plain value)
  return res.json({ resetToken });
};
```

**`/auth/reset-password` Controller:**
```javascript
export const resetPassword = async (req, res) => {
  const { phone, resetToken, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  // Hash the incoming token and compare to what's stored
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  const user = await User.findOne({
    phone,
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // Not expired
  }).select('+password');

  if (!user)
    return res.status(400).json({ error: 'Reset token is invalid or has expired.' });

  // Update password and clear reset fields
  user.password             = newPassword; // pre-save hook re-hashes
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Auto-login
  const token = signToken(user);
  return res.json({ token, user });
};
```

---

#### Shared Auth Utilities `/backend/src/utils/`

**`sendOtp.js`** — shared by register and forgot-password:
```javascript
export const sendOtp = async (phone, purpose) => {
  // Rate limit: 1 OTP per 60s per phone per purpose
  const recent = await Otp.findOne({ phone, purpose });
  if (recent) {
    const elapsed = (Date.now() - recent.createdAt) / 1000;
    if (elapsed < 60) {
      const err = new Error('Please wait before requesting a new code');
      err.status = 429;
      err.retryAfter = Math.ceil(60 - elapsed);
      throw err;
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);

  await Otp.findOneAndDelete({ phone, purpose });
  await Otp.create({ phone, hashedOtp, purpose });

  await smsService.send(phone, `Your Beach Booking code is: ${otp}. Valid for 3 minutes.`);
  if (process.env.NODE_ENV === 'development') console.log(`[OTP][${purpose}] ${phone}: ${otp}`);
};
```

**`consumeOtp.js`** — shared by verify endpoints:
```javascript
export const consumeOtp = async (phone, otp, purpose) => {
  const record = await Otp.findOne({ phone, purpose });
  if (!record) {
    const err = new Error('Code expired. Please request a new one.');
    err.status = 400; throw err;
  }

  record.attempts += 1;
  await record.save();

  if (record.attempts > 3) {
    await record.deleteOne();
    const err = new Error('Too many attempts. Request a new code.');
    err.status = 400; throw err;
  }

  const isValid = await bcrypt.compare(otp, record.hashedOtp);
  if (!isValid) {
    const err = new Error('Invalid code.');
    err.status = 400;
    err.attemptsLeft = 3 - record.attempts;
    throw err;
  }

  await record.deleteOne(); // Consumed — single use
};
```

**`signToken.js`:**
```javascript
export const signToken = (user) =>
  jwt.sign(
    { id: user._id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
```

**Update `Otp` model** — add `purpose` field:
```javascript
// In Otp.js, add to schema:
purpose: {
  type: String,
  enum: ['registration', 'reset'],
  required: true,
},
// Update index to scope per purpose:
otpSchema.index({ phone: 1, purpose: 1 });
```

---

#### `/auth/admin-login` Controller (unchanged)

```javascript
export const adminLogin = async (req, res) => {
  const { secret } = req.body;
  if (secret !== process.env.ADMIN_SECRET)
    return res.status(401).json({ error: 'Unauthorized' });

  const admin = await User.findOne({ role: 'admin' });
  const token = signToken(admin);
  return res.json({ token, user: admin });
};
```

---

### 2.2 Activity Endpoints

| Method | Path                      | Protection | Purpose                           |
|--------|---------------------------|------------|-----------------------------------|
| GET    | `/activities`             | Public     | List all (sorted, paginated)      |
| GET    | `/activities/:id`         | Public     | Single activity detail            |
| POST   | `/activities`             | Admin      | Create new activity               |
| PUT    | `/activities/:id`         | Admin      | Full update                       |
| PATCH  | `/activities/:id`         | Admin      | Partial update (e.g. toggle active)|
| DELETE | `/activities/:id`         | Admin      | Soft-delete (isActive: false)     |
| POST   | `/activities/:id/images`  | Admin      | Upload image → Cloudinary         |

**GET `/activities` Query Params:**
```
?page=1&limit=12        → Pagination (default: page 1, 12 items)
?trending=true          → Filter only trending activities
?search=atv             → Text search on title/description
?sort=popularity        → Default | 'newest' | 'price_asc'
```

**Trending Re-calculation** (called after every confirmed booking):
```javascript
const recomputeTrending = async () => {
  const top = await Activity.find({ isActive: true })
    .sort({ popularityScore: -1 })
    .limit(3)
    .select('_id');
  const topIds = top.map(a => a._id);
  await Activity.updateMany({ isActive: true }, { isTrending: false });
  await Activity.updateMany({ _id: { $in: topIds }, popularityScore: { $gt: 0 } }, { isTrending: true });
};
```

---

### 2.3 Booking Endpoints

| Method | Path                        | Protection | Purpose                                 |
|--------|-----------------------------|------------|-----------------------------------------|
| POST   | `/bookings`                 | User       | Submit booking request (status: 'New') |
| GET    | `/bookings/my`              | User       | Own bookings (paginated, newest first) |
| GET    | `/bookings`                 | Admin      | ALL bookings with user+activity         |
| PATCH  | `/bookings/:id/status`      | Admin      | Change status + handle score increment  |

**PATCH `/bookings/:id/status` Controller:**
```javascript
export const updateStatus = async (req, res) => {
  const { status, adminNote } = req.body;
  const booking = await Booking.findById(req.params.id);
  const prevStatus = booking.status;

  booking.status = status;
  booking.adminNote = adminNote || booking.adminNote;
  booking.statusHistory.push({
    status,
    changedBy: req.user.id,
    note: adminNote,
  });
  await booking.save();

  // ── Popularity score logic ──────────────────────────────
  if (status === 'Confirmed' && prevStatus !== 'Confirmed') {
    await Activity.findByIdAndUpdate(booking.activity, { $inc: { popularityScore: 1 } });
    await recomputeTrending(); // Refresh isTrending flags
  }
  if (prevStatus === 'Confirmed' && status !== 'Confirmed') {
    await Activity.findByIdAndUpdate(booking.activity, { $inc: { popularityScore: -1 } });
    await recomputeTrending();
  }

  return res.json({ booking });
};
```

---

### 2.4 Favorite Endpoints

| Method | Path                     | Protection | Purpose                      |
|--------|--------------------------|------------|------------------------------|
| GET    | `/favorites`             | User       | User's favorited activities  |
| POST   | `/favorites/:activityId` | User       | Toggle (add or remove)       |

**Toggle Controller:**
```javascript
export const toggleFavorite = async (req, res) => {
  const { activityId } = req.params;
  const existing = await Favorite.findOne({ user: req.user.id, activity: activityId });

  if (existing) {
    await existing.deleteOne();
    return res.json({ favorited: false, message: 'Removed from favorites' });
  }
  await Favorite.create({ user: req.user.id, activity: activityId });
  return res.json({ favorited: true, message: 'Added to favorites' });
};
```

---

### 2.5 Profile Endpoints

| Method | Path       | Protection | Purpose                              |
|--------|------------|------------|--------------------------------------|
| GET    | `/profile` | User       | Get own profile data                 |
| PUT    | `/profile` | User       | Update name + social handle fields   |

---

### 2.6 Admin Contact Link Generation (Frontend Utility)

> No backend endpoint needed. Built as a pure frontend helper.

```typescript
// src/lib/utils.ts
export const generateContactLinks = (user: User) => {
  const phone = user.phone.replace(/\D/g, '');
  return {
    whatsapp:  `https://wa.me/${phone}`,
    telegram:  user.telegram  ? `https://t.me/${user.telegram}`              : null,
    instagram: user.instagram ? `https://instagram.com/${user.instagram}`    : null,
    messenger: user.messenger ? `https://m.me/${user.messenger}`             : null,
    snapchat:  user.snapchat  ? `https://snapchat.com/add/${user.snapchat}`  : null,
  };
};
```

---

### 2.7 Middleware Stack

```javascript
// auth.middleware.js
export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// admin.middleware.js
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });
  next();
};
```

---

## PART 3 — FULL PROJECT FOLDER STRUCTURE

```
beach-booking/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                  # mongoose.connect()
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Activity.js
│   │   │   ├── Booking.js
│   │   │   ├── Favorite.js
│   │   │   └── Otp.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── activity.routes.js
│   │   │   ├── booking.routes.js
│   │   │   ├── favorite.routes.js
│   │   │   └── profile.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── activity.controller.js
│   │   │   ├── booking.controller.js
│   │   │   ├── favorite.controller.js
│   │   │   └── profile.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js     # JWT protect
│   │   │   ├── admin.middleware.js    # Role check
│   │   │   ├── rateLimit.middleware.js
│   │   │   └── error.middleware.js    # Global error handler
│   │   ├── services/
│   │   │   ├── sms.service.js         # Twilio / SMS gateway abstraction
│   │   │   └── upload.service.js      # Cloudinary upload helper
│   │   ├── utils/
│   │   │   ├── sendOtp.js             # Generate + hash + SMS send (shared)
│   │   │   ├── consumeOtp.js          # Verify + delete OTP (shared)
│   │   │   ├── signToken.js           # JWT signing helper
│   │   │   ├── recomputeTrending.js   # Shared trending helper
│   │   │   └── validatePhone.js
│   │   └── app.js                     # Express app setup
│   ├── scripts/
│   │   └── seedAdmin.js               # node scripts/seedAdmin.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── images/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx              # Root layout: Navbar + Toaster provider
    │   │   ├── page.tsx                # Homepage / public catalog
    │   │   ├── activity/
    │   │   │   └── [id]/
    │   │   │       └── page.tsx        # Activity detail + booking trigger
    │   │   ├── favorites/
    │   │   │   └── page.tsx            # Authenticated: favorites grid
    │   │   ├── dashboard/
    │   │   │   └── page.tsx            # Authenticated: user booking history
    │   │   ├── profile/
    │   │   │   └── page.tsx            # Authenticated: tabs (bookings/favs/settings)
    │   │   └── admin/
    │   │       ├── layout.tsx          # Admin shell with sidebar
    │   │       ├── login/
    │   │       │   └── page.tsx        # Hidden admin entry (no nav link)
    │   │       ├── page.tsx            # Admin dashboard stats
    │   │       ├── activities/
    │   │       │   └── page.tsx        # CRUD activity manager
    │   │       └── bookings/
    │   │           └── page.tsx        # Booking queue + status management
    │   │
    │   ├── components/
    │   │   ├── ui/                     # Shadcn auto-generated (never hand-edit)
    │   │   │   ├── button.tsx
    │   │   │   ├── card.tsx
    │   │   │   ├── dialog.tsx
    │   │   │   ├── input.tsx
    │   │   │   ├── badge.tsx
    │   │   │   ├── tabs.tsx
    │   │   │   ├── select.tsx
    │   │   │   ├── toast.tsx
    │   │   │   ├── skeleton.tsx
    │   │   │   └── input-otp.tsx
    │   │   │
    │   │   ├── layout/
    │   │   │   ├── Navbar.tsx          # Fixed top bar, auth state aware
    │   │   │   ├── AdminSidebar.tsx    # 250px left nav for admin
    │   │   │   └── Footer.tsx
    │   │   │
    │   │   ├── activity/
    │   │   │   ├── ActivityCard.tsx    # Image + heart + trending badge + CTA
    │   │   │   ├── ActivityGrid.tsx    # Responsive 1/2/3/4-col CSS Grid
    │   │   │   ├── ActivitySkeleton.tsx # Pulsing placeholder card
    │   │   │   └── TrendingBadge.tsx   # 🔥 rose badge component
    │   │   │
    │   │   ├── auth/
    │   │   │   ├── AuthModal.tsx       # Dialog: Login tab | Register tab
    │   │   │   ├── LoginForm.tsx          # Phone + password + 'Forgot password?' link
    │   │   │   ├── RegisterForm.tsx       # Phone + password + name → triggers OTP send
    │   │   │   ├── OtpStep.tsx            # Shared 6-box OTP + countdown (register & reset)
    │   │   │   └── ForgotPasswordFlow.tsx # 3-step: phone → OTP → new password
    │   │   │
    │   │   ├── booking/
    │   │   │   ├── BookingModal.tsx    # Step 1: pick date | Step 2: confirm
    │   │   │   ├── BookingCard.tsx     # User-facing booking with status badge
    │   │   │   └── BookingStatusBadge.tsx
    │   │   │
    │   │   └── admin/
    │   │       ├── BookingQueueTable.tsx  # All bookings, populated, paginated
    │   │       ├── StatusDropdown.tsx     # Inline 1-click status selector
    │   │       ├── ContactGrid.tsx        # WhatsApp/TG/IG/Snap icon action buttons
    │   │       ├── ActivityForm.tsx       # Create/edit activity with image upload
    │   │       └── StatsCard.tsx          # Dashboard metric tile
    │   │
    │   ├── hooks/
    │   │   ├── useAuth.ts              # Auth state + trigger login modal
    │   │   ├── useFavorites.ts         # Toggle with optimistic UI update
    │   │   ├── useActivities.ts        # SWR/React Query for catalog
    │   │   └── useBookings.ts          # User or admin booking fetches
    │   │
    │   ├── lib/
    │   │   ├── api.ts                  # Axios instance + JWT interceptor
    │   │   ├── utils.ts                # cn(), formatDate(), generateContactLinks()
    │   │   └── validations.ts          # Zod schemas for all forms
    │   │
    │   ├── store/
    │   │   └── authStore.ts            # Zustand: { user, token, setAuth, logout }
    │   │
    │   └── types/
    │       └── index.ts                # Shared TS interfaces
    │
    ├── .env.local
    ├── next.config.ts
    ├── tailwind.config.ts
    └── package.json
```

---

## PART 4 — STEP-BY-STEP IMPLEMENTATION ORDER

### ✅ Phase 0 — Bootstrap (Day 1)

```bash
# 1. Create monorepo root
mkdir beach-booking && cd beach-booking
mkdir backend frontend

# 2. Backend dependencies
cd backend && npm init -y
npm install express mongoose bcryptjs jsonwebtoken dotenv cors helmet \
  morgan express-rate-limit multer cloudinary @aws-sdk/client-s3

# 3. Frontend: Next.js + Shadcn + state
cd ../frontend
npx create-next-app@latest . --typescript --tailwind --app --src-dir
npx shadcn@latest init
npx shadcn@latest add button card dialog input badge tabs select toast skeleton input-otp

npm install zustand axios react-hook-form @hookform/resolvers zod
npm install date-fns react-day-picker lucide-react
npm install swr                       # or: @tanstack/react-query

# 4. External services
# → MongoDB Atlas: create free cluster, copy connection string to .env
# → Cloudinary: create account, note CLOUD_NAME / API_KEY / API_SECRET
# → SMS: Twilio trial account (or local provider for Egypt)
```

---

### ✅ Phase 1 — Backend Core (Days 2–3)

```
Step 1  db.js — mongoose.connect() with error handling
Step 2  All 5 Mongoose models (verify TTL index on Otp with db.listIndexes())
Step 3  authMiddleware + adminMiddleware + global errorHandler
Step 4  Auth routes: request-otp + verify-otp (dev: console.log OTP)
Step 5  scripts/seedAdmin.js — create admin user + test admin-login route
Step 6  Activity CRUD routes (test with Postman/Thunder Client)
Step 7  Booking routes (create + my + all + status change)
Step 8  Favorites toggle route
Step 9  Profile GET + PUT routes
Step 10 sms.service.js — wire real SMS gateway, replace console.log
```

---

### ✅ Phase 2 — Frontend Foundation (Days 4–5)

```
Step 11  tailwind.config.ts — add CSS variables from design system
Step 12  Zustand authStore + axios instance with JWT Bearer interceptor
Step 13  Navbar — logo, nav links, conditional login/profile button
Step 14  ActivityCard — image aspect ratio, heart toggle (unauthenticated triggers modal), trending badge, Book Now CTA
Step 15  ActivitySkeleton — pixel-matched pulsing version of ActivityCard
Step 16  Homepage — ActivityGrid, skeleton loading state, SWR data fetch
```

---

### ✅ Phase 3 — Auth Flow (Day 6)

```
Step 17  AuthModal — Dialog with "Login" and "Register" tabs, plus "Forgot password?" link
Step 18  LoginForm — phone input + password input, Zod validation, inline errors, submit → POST /auth/login
Step 19  RegisterForm — phone + password + name, submit → POST /auth/register → transitions to OtpStep
Step 20  OtpStep — shared component (used by register + forgot-password), 6 boxes, 3-min countdown, Resend disabled until 0:00
Step 21  ForgotPasswordFlow — 3 internal states: (a) phone input → POST /auth/forgot-password, (b) OtpStep → POST /auth/reset-password/verify → gets resetToken, (c) new password input → POST /auth/reset-password
Step 22  On any login/register success: setAuth(token, user) in Zustand, persist to localStorage, toast "Welcome back!"
```

---

### ✅ Phase 4 — User Features (Days 7–8)

```
Step 22  Activity detail page — full description, image gallery, price, Book Now button
Step 23  BookingModal — Step 1: react-day-picker calendar | Step 2: summary + Confirm
Step 24  Connect booking submit to POST /bookings, show success toast
Step 25  User dashboard — /dashboard, BookingCard list with status badges
Step 26  Favorites page — /favorites, same ActivityGrid layout, empty state illustration
Step 27  Optimistic heart toggle — update local state immediately, revert on API error
Step 28  Profile page — Shadcn Tabs (My Bookings | Favorites | Settings), social handle form with platform icons, save with toast
```

---

### ✅ Phase 5 — Admin Panel (Days 9–10)

```
Step 29  /admin/login — full-screen centered form, no Navbar, POST to /auth/admin-login
Step 30  AdminSidebar — 250px, links: Dashboard / Activities / Bookings, active state highlight
Step 31  Admin dashboard — StatsCard grid (New bookings, Confirmed, Total revenue, Top activity)
Step 32  Activities page — data table + "+ Add Activity" button → ActivityForm modal
Step 33  ActivityForm — all fields + drag-drop Cloudinary image upload, edit mode pre-fills
Step 34  Booking queue — BookingQueueTable with user info, desired date, activity name
Step 35  StatusDropdown — Shadcn Select inline in table row, PATCH on change, toast on success
Step 36  ContactGrid — icon buttons per available handle (WhatsApp always present from phone, others conditional), opens generated link in new tab
Step 37  Confirm that popularityScore increments and isTrending reruns on status → Confirmed
```

---

### ✅ Phase 6 — Polish & Deployment (Days 11–12)

```
Step 38  Protected route logic — redirect unauthenticated users attempting /dashboard, /favorites, /profile to modal trigger
Step 39  Rate limiter on POST /auth/request-otp: max 3 requests per phone per hour
Step 40  Mobile audit — Navbar hamburger menu, grid breakpoints, modal full-screen on mobile
Step 41  Error boundaries + custom 404 page with "Back to Catalog" CTA
Step 42  Toast coverage audit: favorites, booking submit, status change, profile save, auth success/error
Step 43  Backend deploy → Railway (git push, set env vars in dashboard)
Step 44  Frontend deploy → Vercel (connect GitHub repo, set NEXT_PUBLIC_API_URL)
Step 45  Final smoke test: OTP flow, book an activity, admin confirms, score increments, trending badge appears
```

---

## PART 5 — FINALIZED DESIGN SYSTEM PROMPT

```
## DESIGN SYSTEM — Beach Travel Booking Platform (Shadcn UI Aesthetic)
## Paste this block at the top of every UI generation prompt. All pages must comply.

═══════════════════════════════════════════════════════════════════
  GRADING CRITERIA
═══════════════════════════════════════════════════════════════════
UX — 50 pts:
  10 pts  Information Architecture: travel images are the primary visual
          element. Crisp grid layout. Zero clutter.
   5 pts  Feedback & Visibility: skeleton loaders on every async image
          block; toast notifications for favorites, OTP states, and
          booking submissions; optimistic UI on heart toggles.
   5 pts  Reversible Navigation: fixed top navbar (h-16, backdrop-blur);
          breadcrumbs or active tab highlights on every sub-page.
   5 pts  Learnability: login modal — clear numeric phone input, individual
          OTP digit boxes, explicit countdown timer, obvious placeholder text.
   5 pts  Efficiency: 1-click heart toggle on cards; max 2-step booking form
          (date → confirm); 1-click status dropdown in admin queue.
  10 pts  Design for Errors: red inline messages below invalid phone format
          and wrong OTP; disable Resend button until countdown expires;
          show attempts remaining on wrong OTP.
  10 pts  Satisfaction: premium, breezy, trustworthy vacation vibe — feels
          like a coastal boutique, not a generic SaaS tool.

UI — 30 pts:
  15 pts  UI Element Consistency: strict Shadcn component spec —
          ring-offset focus states, muted backgrounds, subtle borders.
  15 pts  Professional Look: clean Inter typography, uniform spacing,
          symmetric card grids, consistent use of the color palette.

═══════════════════════════════════════════════════════════════════
  TYPOGRAPHY
═══════════════════════════════════════════════════════════════════
Font family : Inter (Google Fonts import)
Scale       : 12px caption · 14px sm · 16px body · 18px lg
              24px h3 · 30px h2 · 36–48px hero/display
Weights     : 400 body · 500 buttons+labels · 600 subheadings
              700 headings · 800 hero/display
Line height : 1.5 body · 1.2 headings
Tracking    : -0.02em on display text, normal on body

═══════════════════════════════════════════════════════════════════
  COLOR PALETTE — Tailwind Zinc + Ocean scale
═══════════════════════════════════════════════════════════════════
--background:        #FFFFFF   /* Pure white page */
--foreground:        #09090B   /* Zinc 950 — primary text */
--muted:             #F4F4F5   /* Zinc 100 — disabled, secondary bg */
--muted-foreground:  #71717A   /* Zinc 500 — placeholder, secondary text */
--border:            #E4E4E7   /* Zinc 200 — cards, inputs, dividers */
--input:             #E4E4E7   /* Same as border for input rings */
--ring:              #0284C7   /* Focus ring color */
--primary:           #0284C7   /* Sky 600 — main CTAs, active states */
--primary-foreground:#FFFFFF   /* Text on primary bg */
--primary-hover:     #0369A1   /* Sky 700 — hover on primary buttons */
--accent:            #F0F9FF   /* Sky 50 — card hover bg, list item hover */
--accent-foreground: #0C4A6E   /* Sky 900 */
--destructive:       #EF4444   /* Red 500 — errors, delete */
--success:           #10B981   /* Emerald 500 — confirmed, toast success */
--warning:           #F59E0B   /* Amber 500 — "Contacted" status */
--whatsapp:          #25D366   /* Official WhatsApp green */
--card:              #FFFFFF
--card-foreground:   #09090B

═══════════════════════════════════════════════════════════════════
  SPACING & LAYOUT
═══════════════════════════════════════════════════════════════════
Page container  : max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8
Section padding : pt-12 pb-24 (vertical breathing room)
Gap             : gap-6 (24px) on all grids; gap-4 on form rows
Admin Sidebar   : w-[250px] min-h-screen border-r border-border
                  bg-muted/50 px-4 py-6 sticky top-0
Catalog grid    : grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                  xl:grid-cols-4 gap-6
Radius          : rounded-md (8px) buttons/inputs
                  rounded-xl (12px) cards/modals/images
                  rounded-full heart button, badges, avatars
Navbar          : fixed top-0 left-0 right-0 z-50 h-16
                  bg-background/80 backdrop-blur-md
                  border-b border-border

═══════════════════════════════════════════════════════════════════
  COMPONENT SPECIFICATIONS
═══════════════════════════════════════════════════════════════════

── Buttons ─────────────────────────────────────────────────────
Primary   : bg-primary text-primary-foreground h-10 px-4 py-2
            rounded-md font-medium text-sm hover:bg-primary-hover
            transition-colors focus-visible:ring-2
            focus-visible:ring-ring focus-visible:ring-offset-2
            disabled:opacity-50 disabled:pointer-events-none

Ghost     : bg-transparent hover:bg-accent hover:text-accent-foreground
            h-10 px-4 py-2 rounded-md

Destructive: bg-destructive text-white hover:bg-destructive/90

Icon button: h-9 w-9 rounded-full flex items-center justify-center
             hover:bg-muted transition-colors

── Inputs ───────────────────────────────────────────────────────
Standard  : h-10 w-full rounded-md border border-input
            bg-background px-3 py-2 text-sm
            placeholder:text-muted-foreground
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-ring focus-visible:ring-offset-2

Error state: border-destructive focus-visible:ring-destructive

OTP boxes : 6 × (w-10 h-12 text-center text-lg font-semibold
            rounded-md border border-input bg-background
            focus:ring-2 focus:ring-ring)
            arranged in a row with gap-2

Phone input: country prefix (+20) shown in a left-aligned
             non-editable span inside a relative wrapper,
             actual input padded-left to clear the prefix

── Cards (Activity) ─────────────────────────────────────────────
Wrapper   : rounded-xl border bg-card text-card-foreground
            shadow-sm overflow-hidden relative
            hover:shadow-md transition-shadow duration-300
            group cursor-pointer

Image     : w-full aspect-[4/3] object-cover
            transition-transform duration-300
            group-hover:scale-105

Heart btn : absolute top-3 right-3 z-10
            bg-white/80 backdrop-blur-sm rounded-full
            h-9 w-9 flex items-center justify-center
            hover:bg-white transition-all shadow-sm
            [unfavorited] stroke-foreground fill-transparent
            [favorited]   stroke-rose-500 fill-rose-500

Body      : p-4 flex flex-col gap-2

Title     : font-semibold text-base leading-tight text-foreground

Price     : text-primary font-semibold text-sm

Description: text-muted-foreground text-sm line-clamp-2

Book CTA  : Primary button w-full mt-3 h-9 text-sm

── Trending Badge ───────────────────────────────────────────────
Placement : absolute top-3 left-3 z-10
Style     : inline-flex items-center gap-1
            rounded-full px-2.5 py-0.5 text-xs font-semibold
            bg-rose-100 text-rose-700 border-transparent
Content   : "🔥 Trending"

── Status Badges ────────────────────────────────────────────────
New        : bg-blue-100 text-blue-700 border-transparent
Contacted  : bg-amber-100 text-amber-700 border-transparent
Confirmed  : bg-emerald-100 text-emerald-700 border-transparent
Cancelled  : bg-zinc-100 text-zinc-500 border-transparent
Common     : inline-flex items-center rounded-full
             px-2.5 py-0.5 text-xs font-semibold

── Skeleton Loader ──────────────────────────────────────────────
Use Shadcn Skeleton (animate-pulse bg-muted)
Match exact card layout:
  - Skeleton h-48 w-full rounded-t-xl (image area)
  - Skeleton h-4 w-3/4 mt-4 mx-4 (title)
  - Skeleton h-3 w-full mx-4 (desc line 1)
  - Skeleton h-3 w-2/3 mx-4 (desc line 2)
  - Skeleton h-9 w-full m-4 (button)

── Toast Notifications ──────────────────────────────────────────
Success : bg-background border border-success text-foreground
          Left colored stripe: 4px solid --success
Error   : Left colored stripe: 4px solid --destructive
Position: bottom-right (Shadcn Toaster default)
Duration: 3000ms
Examples:
  "❤️ Added to favorites"  (success)
  "💔 Removed from favorites"
  "✅ Booking submitted!"
  "Status updated to Confirmed"
  "Code sent to +201xxxxxxxx"
  "Invalid code. 2 attempts left." (error)

── Auth Modal ───────────────────────────────────────────────────
Trigger   : Any protected action (favorite, Book Now, profile)
Style     : Shadcn Dialog, max-w-sm, centered
Tabs      : "Login" (default) | "Register" — Shadcn Tabs inside dialog

Login Tab:
  Phone input   : with +20 prefix indicator
  Password input: type="password" + show/hide toggle (Eye/EyeOff icon)
  CTA           : "Log In" primary button, full width, h-10
  Link below    : "Forgot password?" → opens ForgotPasswordFlow inline
  Validation    : inline red text on blur; "Invalid credentials" on 401

Register Tab:
  Name input    : optional, placeholder "Your name (optional)"
  Phone input   : with +20 prefix indicator
  Password input: min 8 chars + strength bar below field
                  (red = weak · amber = fair · green = strong)
  CTA           : "Create Account" → POST /auth/register → advance to OTP step
  Validation    : inline red text on blur/submit

OTP Verification Step (shared — used by Register and Reset):
  Heading   : "Enter the code"
  Subtext   : "Sent to [phone]" with pencil icon to go back
  OTP input : 6 centered boxes, auto-focus first, auto-submit on 6th digit
  Countdown : "Resend code in 01:59" (muted text)
              After 0:00 → "Resend code" link (primary color)
  Error     : "Invalid code. N attempts left." in --destructive below boxes

Forgot Password Flow (3 internal steps, same dialog):
  Step 1 — Phone: input + "Send Reset Code" CTA
  Step 2 — OTP: shared OtpStep (purpose = 'reset')
  Step 3 — New password: password field + confirm field + "Reset Password" CTA
           On success: auto-login + toast "Password updated. Welcome back!"

── Admin Sidebar ─────────────────────────────────────────────────
Width     : 250px, sticky top-0, min-h-screen
Background: bg-muted/50 border-r border-border
Logo area : py-5 px-4, platform name + wave icon
Nav items : flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
            font-medium text-muted-foreground
            hover:bg-accent hover:text-foreground transition-colors
Active    : bg-accent text-foreground font-semibold
Icons     : Lucide icons (LayoutDashboard, Waves, CalendarCheck)

── Admin Booking Queue ───────────────────────────────────────────
Table     : full-width, border border-border rounded-xl overflow-hidden
Header    : bg-muted/50 text-xs uppercase tracking-wide
            text-muted-foreground font-semibold
Row       : hover:bg-accent/50 transition-colors
            border-b border-border last:border-0
Columns   : User (name + phone) | Activity | Date | Status | Actions

StatusDropdown: Shadcn Select inline in Status column
ContactGrid   : Row of small icon buttons in Actions column
  WhatsApp : bg-[#25D366] text-white (always shown from phone)
  Telegram : bg-sky-500 text-white (shown if handle exists)
  Instagram: bg-gradient-to-br from-purple-500 to-rose-500 text-white
  Messenger: bg-blue-600 text-white
  Snapchat : bg-yellow-400 text-black
  Each     : h-7 w-7 rounded-full flex items-center justify-center
             text-xs hover:opacity-80 transition-opacity
  Tooltip  : show handle on hover

── Profile Page Tabs ─────────────────────────────────────────────
Use Shadcn Tabs: "My Bookings" | "Favorites" | "Settings"
Settings form:
  Each social field: left icon (brand color) + Input + save indicator
  Telegram  : airplane icon (sky-500)
  Instagram : camera icon (purple-500)
  Snapchat  : ghost icon (yellow-400)
  Messenger : lightning icon (blue-600)
  WhatsApp  : phone icon (emerald-500), auto-populated from login phone

── Booking Modal (2-Step) ───────────────────────────────────────
Step 1 — Date Selection:
  Shadcn Dialog max-w-md
  react-day-picker calendar, min date = tomorrow
  Disabled dates: past dates grayed out
  CTA: "Continue →" primary button (disabled until date selected)

Step 2 — Confirmation:
  Summary card: Activity name, selected date, price
  CTA: "Confirm Booking" primary button
  Back: ghost "← Change date" link
  On submit: loading spinner in button, success toast, modal closes

═══════════════════════════════════════════════════════════════════
  ANIMATIONS & TRANSITIONS
═══════════════════════════════════════════════════════════════════
Card hover    : shadow-sm → shadow-md (300ms ease)
Image zoom    : scale-100 → scale-105 (300ms ease, overflow hidden)
Heart fill    : instant fill + scale-125 → scale-100 (150ms bounce)
Modal open    : Shadcn Dialog default (fade + scale from 95%)
Skeleton pulse: animate-pulse (Tailwind default, 2s infinite)
Toast slide   : slide-in-from-bottom-right (Shadcn default)
Tab switch    : instant, no animation (keep it crisp)
Nav underline : active link left-border slides in (200ms)
Button press  : scale-[0.98] on active/mousedown

═══════════════════════════════════════════════════════════════════
  RESPONSIVE BREAKPOINTS
═══════════════════════════════════════════════════════════════════
Mobile  (< 640px) : 1-col grid, full-screen modals,
                    hamburger nav menu, bottom-fixed CTA on detail page
Tablet  (640–1024px): 2-col grid, slide-over sidebar for admin
Desktop (> 1024px) : 3–4 col grid, fixed sidebar, standard modals

═══════════════════════════════════════════════════════════════════
  UX RULES — MANDATORY
═══════════════════════════════════════════════════════════════════
1. OPEN CATALOG: Unauthenticated users see full catalog immediately.
   Auth modal fires only on: heart toggle, "Book Now", profile access.

2. OTP TIMER: Countdown starts immediately after code is sent.
   Resend link is hidden and replaced by countdown. Only appears
   after timer reaches 0:00.

3. ATTEMPTS DISPLAY: After a wrong OTP, show "Invalid code.
   N attempts left." below the OTP boxes in --destructive color.

4. ADMIN HIDDEN: The admin route (/admin/login) has no link in
   the public navbar. Typing it directly reveals a standalone
   full-page form with no shared layout.

5. CONTACT GRID: WhatsApp is always rendered (derived from phone).
   Other platform buttons only render if the user has filled in
   that handle in their profile. Never show a broken link.

6. POPULARITY INTEGRITY: popularityScore only increments when
   status transitions TO "Confirmed" (not re-incremented if
   already Confirmed). Decrements if reversed from Confirmed.

7. SOFT DELETE: Deleting an activity sets isActive: false.
   All existing bookings referencing it are preserved in DB.
   The activity disappears from the public catalog immediately.

8. IMAGE FALLBACK: Every ActivityCard must show a gray muted
   placeholder (bg-muted animate-pulse) while the Cloudinary
   image loads. On error, show a wave/beach icon placeholder.
```

---

## PART 6 — ENVIRONMENT VARIABLES REFERENCE

### Backend `.env`
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=super_long_random_string_here
JWT_EXPIRES_IN=30d
ADMIN_SECRET=your_hidden_admin_passphrase
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+1234567890
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## PART 7 — KEY TECHNICAL DECISIONS SUMMARY

| Decision | Choice | Reason |
|---|---|---|
| OTP storage | MongoDB TTL (180s) | Zero extra infra, automatic cleanup |
| OTP security | bcrypt hash in DB | Plain text OTP never persisted |
| Auth sessions | JWT 30-day expiry | Stateless, scales horizontally |
| Admin auth | Env secret + JWT | No password in DB, simple & secure |
| Image hosting | Cloudinary | Free CDN tier, transform API |
| State management | Zustand | Minimal boilerplate vs Redux |
| Forms | React Hook Form + Zod | Native performance, type-safe schemas |
| Data fetching | SWR | Built-in cache, revalidation, stale-while-revalidate |
| Favorites UX | Optimistic toggle | Instant feel, revert on error |
| Trending calc | Post-booking re-run | Consistent, avoids stale flags |
| Soft delete | `isActive` flag | Preserves booking history integrity |
