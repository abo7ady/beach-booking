## DESIGN SYSTEM — Beach Travel Booking Platform (Shadcn UI Aesthetic)

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
