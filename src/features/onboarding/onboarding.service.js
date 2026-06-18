const User = require('../user/user.model');
const { calculateEmissions, getPersona } = require('../carbon/carbon.calculator');

// ─── Constants ───────────────────────────────────────────────────────────────

const ONBOARDING_REWARD = {
  greenPoints: 500,
  levelUp: 2,
  badgeId: 'first-steps',
};

const VALID_TRANSPORT_MODES = ['car', 'bike', 'public', 'walking', 'wfh'];
const VALID_DIET_TYPES     = ['vegan', 'vegetarian', 'omnivore', 'meat-heavy'];
const VALID_GOALS          = ['reduce25', 'reduce50', 'offset', 'awareness'];
const VALID_WORK_STYLES    = ['office', 'remote', 'hybrid'];

// ─── Custom Error ────────────────────────────────────────────────────────────

class OnboardingError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'OnboardingError';
    this.statusCode = statusCode;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Retrieve a user by ID or throw a 404 error.
 */
const findUserOrFail = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new OnboardingError('User not found', 404);
  }
  return user;
};

/**
 * Map the flat onboarding payload from the client into the nested profile
 * schema shape expected by the User model.
 *
 * The client sends flat fields (transportMode, dailyTravelKm, etc.) while the
 * model stores them both as nested sub-documents AND as legacy flat fields.
 * This normaliser ensures both representations stay in sync.
 */
const normaliseProfileData = (data) => {
  const profile = {};

  // Location
  if (data.city !== undefined)    profile.city = data.city;
  if (data.country !== undefined) profile.country = data.country;

  // Transportation (nested + legacy)
  if (data.transportMode !== undefined || data.dailyTravelKm !== undefined) {
    profile.transportation = {};
    if (data.transportMode !== undefined) {
      profile.transportation.mode = data.transportMode;
      profile.transportMode = data.transportMode;          // legacy
    }
    if (data.dailyTravelKm !== undefined) {
      profile.transportation.dailyDistanceKm = Number(data.dailyTravelKm);
      profile.dailyTravelKm = Number(data.dailyTravelKm); // legacy
    }
  }

  // Electricity (nested + legacy)
  if (data.monthlyElectricityKwh !== undefined) {
    profile.electricity = { monthlyUsage: Number(data.monthlyElectricityKwh) };
    profile.monthlyElectricityKwh = Number(data.monthlyElectricityKwh); // legacy
  }

  // Lifestyle (nested + legacy)
  if (data.dietType !== undefined || data.dailyDigitalHours !== undefined) {
    profile.lifestyle = {};
    if (data.dietType !== undefined) {
      profile.lifestyle.dietType = data.dietType;
      profile.dietType = data.dietType;                        // legacy
    }
    if (data.dailyDigitalHours !== undefined) {
      profile.lifestyle.screenTime = Number(data.dailyDigitalHours);
      profile.dailyDigitalHours = Number(data.dailyDigitalHours); // legacy
    }
  }

  // Sustainability goal (nested + legacy)
  if (data.goalType !== undefined) {
    profile.sustainabilityGoal = data.goalType;
    profile.goalType = data.goalType; // legacy
  }

  // Household & work style (legacy only)
  if (data.householdSize !== undefined) profile.householdSize = Number(data.householdSize);
  if (data.workStyle !== undefined)     profile.workStyle = data.workStyle;

  return profile;
};

/**
 * Validate that a profile object contains all the required fields needed to
 * mark onboarding as complete.  Throws OnboardingError on the first violation.
 */
const validateCompletionRequirements = (profile) => {
  const errors = [];

  if (!profile.city) {
    errors.push('City is required');
  }

  // Transport mode (check nested first, fall back to legacy)
  const mode = profile.transportation?.mode || profile.transportMode;
  if (!mode || !VALID_TRANSPORT_MODES.includes(mode)) {
    errors.push('A valid transportation mode is required');
  }

  // Daily distance (nested → legacy)
  const distance = profile.transportation?.dailyDistanceKm ?? profile.dailyTravelKm;
  if (distance === undefined || distance === null || Number(distance) < 0) {
    errors.push('Daily travel distance must be 0 or greater');
  }

  // Monthly electricity (nested → legacy)
  const electricity = profile.electricity?.monthlyUsage ?? profile.monthlyElectricityKwh;
  if (electricity === undefined || electricity === null || Number(electricity) < 0) {
    errors.push('Monthly electricity usage must be 0 or greater');
  }

  // Diet type (nested → legacy)
  const diet = profile.lifestyle?.dietType || profile.dietType;
  if (!diet || !VALID_DIET_TYPES.includes(diet)) {
    errors.push('A valid diet type is required');
  }

  // Screen time / daily digital hours (nested → legacy)
  const screen = profile.lifestyle?.screenTime ?? profile.dailyDigitalHours;
  if (screen === undefined || screen === null || Number(screen) < 0) {
    errors.push('Daily digital hours must be 0 or greater');
  }

  // Sustainability goal (nested → legacy)
  const goal = profile.sustainabilityGoal || profile.goalType;
  if (!goal || !VALID_GOALS.includes(goal)) {
    errors.push('A valid sustainability goal is required');
  }

  if (errors.length > 0) {
    throw new OnboardingError(`Onboarding incomplete: ${errors.join('; ')}`);
  }
};

/**
 * Build a flat profile representation suitable for the carbon calculator,
 * which expects the legacy flat field names.
 */
const toCalculatorInput = (profile) => ({
  transportMode:        profile.transportation?.mode        || profile.transportMode   || 'walking',
  dailyTravelKm:        profile.transportation?.dailyDistanceKm ?? profile.dailyTravelKm ?? 0,
  monthlyElectricityKwh: profile.electricity?.monthlyUsage  ?? profile.monthlyElectricityKwh ?? 0,
  dietType:             profile.lifestyle?.dietType          || profile.dietType        || 'vegetarian',
  dailyDigitalHours:    profile.lifestyle?.screenTime        ?? profile.dailyDigitalHours ?? 0,
});

// ─── Service Methods ─────────────────────────────────────────────────────────

/**
 * Fetch the current onboarding state for a user.
 *
 * Returns the profile, computed emissions, derived persona, and whether
 * onboarding has already been completed.
 */
const getOnboarding = async (userId) => {
  const user = await findUserOrFail(userId);
  const profileObj = user.profile?.toObject?.() ?? user.profile ?? {};
  const emissions = calculateEmissions(toCalculatorInput(profileObj));
  const persona = getPersona(emissions);

  return {
    profile: profileObj,
    emissions,
    persona,
    onboardingCompleted: user.onboardingCompleted,
  };
};

/**
 * Partially update onboarding progress (merge semantics).
 *
 * The client may save incremental progress (e.g. after each wizard step)
 * without requiring all fields to be present.
 *
 * State-transition guard: if onboarding is already completed, partial updates
 * are rejected — the user should use the profile-update flow instead.
 */
const updateOnboardingProgress = async (userId, data) => {
  const user = await findUserOrFail(userId);

  if (user.onboardingCompleted) {
    throw new OnboardingError(
      'Onboarding is already completed. Use the profile update endpoint to modify your data.',
      409,
    );
  }

  // Normalise incoming payload → profile shape
  const incoming = normaliseProfileData(data);

  // Deep-merge with existing profile
  const existing = user.profile?.toObject?.() ?? user.profile ?? {};
  user.profile = deepMergeProfile(existing, incoming);

  // Re-derive persona from latest merged profile
  const emissions = calculateEmissions(toCalculatorInput(user.profile));
  user.persona = getPersona(emissions);

  await user.save();

  return {
    profile: user.profile,
    emissions,
    persona: user.persona,
    onboardingCompleted: user.onboardingCompleted,
  };
};

/**
 * Complete the onboarding flow.
 *
 * 1. Merges the final payload into the profile.
 * 2. Validates that all required fields are now present.
 * 3. Guards against double-completion.
 * 4. Calculates emissions, derives persona.
 * 5. Awards gamification rewards (green points, level-up, badge).
 * 6. Marks onboarding as completed on both the user root and profile.
 */
const completeOnboarding = async (userId, data) => {
  const user = await findUserOrFail(userId);

  // State-transition guard — prevent double-completion reward exploit
  if (user.onboardingCompleted) {
    throw new OnboardingError(
      'Onboarding has already been completed for this account.',
      409,
    );
  }

  // Normalise and merge
  const incoming = normaliseProfileData(data);
  const existing = user.profile?.toObject?.() ?? user.profile ?? {};
  const merged = deepMergeProfile(existing, incoming);

  // Validate completeness before committing
  validateCompletionRequirements(merged);

  user.profile = merged;

  // Calculate emissions & persona
  const emissions = calculateEmissions(toCalculatorInput(user.profile));
  user.persona = getPersona(emissions);

  // Award onboarding gamification rewards
  user.gamification.greenPoints += ONBOARDING_REWARD.greenPoints;
  user.gamification.level = Math.max(user.gamification.level, ONBOARDING_REWARD.levelUp);

  const alreadyHasBadge = user.gamification.earnedBadges.some(
    (b) => b.id === ONBOARDING_REWARD.badgeId,
  );
  if (!alreadyHasBadge) {
    user.gamification.earnedBadges.push({
      id: ONBOARDING_REWARD.badgeId,
      earnedAt: new Date(),
    });
  }

  // Mark completed on both root and profile sub-document
  user.onboardingCompleted = true;
  user.profile.onboardingCompleted = true;

  await user.save();

  return {
    profile: user.profile,
    emissions,
    persona: user.persona,
    onboardingCompleted: true,
    rewards: {
      greenPoints: ONBOARDING_REWARD.greenPoints,
      level: user.gamification.level,
      badge: ONBOARDING_REWARD.badgeId,
    },
  };
};

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Deep-merge two profile objects.  For nested sub-documents (transportation,
 * electricity, lifestyle) the merge is one level deep so that individual
 * nested fields can be updated independently.
 */
const deepMergeProfile = (existing, incoming) => {
  const merged = { ...existing };

  for (const [key, value] of Object.entries(incoming)) {
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof existing[key] === 'object' &&
      existing[key] !== null
    ) {
      // One-level deep merge for sub-documents
      merged[key] = { ...existing[key], ...value };
    } else {
      merged[key] = value;
    }
  }

  return merged;
};

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  getOnboarding,
  updateOnboardingProgress,
  completeOnboarding,
  // Exported for testing
  OnboardingError,
  normaliseProfileData,
  validateCompletionRequirements,
  deepMergeProfile,
  toCalculatorInput,
};
