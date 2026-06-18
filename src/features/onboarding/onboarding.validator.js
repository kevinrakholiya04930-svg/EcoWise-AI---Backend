const { body } = require('express-validator');

const transportModes = ['car', 'bike', 'public', 'walking', 'wfh'];
const dietTypes = ['vegan', 'vegetarian', 'omnivore', 'meat-heavy'];
const sustainabilityGoals = ['reduce25', 'reduce50', 'offset', 'awareness'];

const optionalOnboardingValidator = [
  body('city')
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage('City must be 120 characters or fewer'),
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
