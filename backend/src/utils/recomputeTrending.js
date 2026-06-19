import Activity from '../models/Activity.js';

export const recomputeTrending = async () => {
  const top = await Activity.find({ isActive: true })
    .sort({ popularityScore: -1 })
    .limit(3)
    .select('_id');
  const topIds = top.map((a) => a._id);

  // Clear all trending flags
  await Activity.updateMany({ isActive: true }, { isTrending: false });

  // Set top 3 with score > 0 as trending
  if (topIds.length > 0) {
    await Activity.updateMany(
      { _id: { $in: topIds }, popularityScore: { $gt: 0 } },
      { isTrending: true }
    );
  }
};
