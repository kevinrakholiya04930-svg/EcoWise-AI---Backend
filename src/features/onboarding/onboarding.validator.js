const { body } = require('express-validator');

const transportModes = ['car', 'bike', 'bus', 'metro', 'walking', 'mixed', 'public', 'wfh'];
const dietTypes = ['vegan', 'vegetarian', 'balanced', 'omnivore', 'meat-heavy'];
const sustainabilityGoals = ['transportation', 'electricity', 'lifestyle', 'sustainability', 'reduce25', 'reduce50', 'offset', 'awareness'];

const optionalOnboardingValidator = [
  body('city')
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage('City must be 120 characters or fewer'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Full name must be 120 characters or fewer'),
  body('onboardingStep')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Onboarding step is invalid'),
  body('transportMode')
    .optional()
    .isIn(transportModes)
    .withMessage('Transportation mode is invalid'),
  body('dailyDistanceKm')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Daily distance must be a number greater than or equal to 0'),
  body('dailyTravelKm')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Daily distance must be a number greater than or equal to 0'),
  body('monthlyElectricityKwh')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly electricity usage must be a number greater than or equal to 0'),
  body('dietType')
    .optional()
    .isIn(dietTypes)
    .withMessage('Diet type is invalid'),
  body('screenTimeHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Screen time must be a number greater than or equal to 0'),
  body('dailyDigitalHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Screen time must be a number greater than or equal to 0'),
  body('goal')
    .optional()
    .isIn(sustainabilityGoals)
    .withMessage('Sustainability goal is invalid'),
  body('goalType')
    .optional()
    .isIn(sustainabilityGoals)
    .withMessage('Sustainability goal is invalid'),
  body('transportation.mode')
    .optional()
    .isIn(transportModes)
    .withMessage('Transportation mode is invalid'),
  body('transportation.dailyDistanceKm')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Daily distance must be a number greater than or equal to 0'),
  body('electricity.monthlyUsage')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly electricity usage must be a number greater than or equal to 0'),
  body('lifestyle.dietType')
    .optional()
    .isIn(dietTypes)
    .withMessage('Diet type is invalid'),
  body('lifestyle.screenTime')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Screen time must be a number greater than or equal to 0'),
  body('sustainabilityGoal')
    .optional()
    .isIn(sustainabilityGoals)
    .withMessage('Sustainability goal is invalid')
];

const completeOnboardingValidator = [
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 120 })
    .withMessage('City must be 120 characters or fewer'),
  body('transportation.mode')
    .isIn(transportModes)
    .withMessage('Transportation mode is invalid'),
  body('transportation.dailyDistanceKm')
    .isFloat({ min: 0 })
    .withMessage('Daily distance must be a number greater than or equal to 0'),
  body('electricity.monthlyUsage')
    .isFloat({ min: 0 })
    .withMessage('Monthly electricity usage must be a number greater than or equal to 0'),
  body('lifestyle.dietType')
    .isIn(dietTypes)
    .withMessage('Diet type is invalid'),
  body('lifestyle.screenTime')
    .isFloat({ min: 0 })
    .withMessage('Screen time must be a number greater than or equal to 0'),
  body('sustainabilityGoal')
    .isIn(sustainabilityGoals)
    .withMessage('Sustainability goal is invalid')
];

module.exports = {
  optionalOnboardingValidator,
  completeOnboardingValidator
};
