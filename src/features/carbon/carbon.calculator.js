const FACTORS = Object.freeze({
  transport: Object.freeze({
    car: 0.21,
    bike: 0.008,
    public: 0.089,
    walking: 0.001,
    wfh: 0,
  }),

  electricity: 0.41,

  food: Object.freeze({
    vegan: 45,
    vegetarian: 75,
    omnivore: 114,
    'meat-heavy': 180,
  }),

  digital: 0.036,
});

const round = (num) => Math.round(num * 100) / 100;

const calculateEmissions = (profile = {}) => {
  const {
    transportMode = 'walking',
    dailyTravelKm = 0,
    monthlyElectricityKwh = 0,
    dietType = 'vegetarian',
    dailyDigitalHours = 0,
  } = profile;

  const transportFactor =
    FACTORS.transport[transportMode] ?? 0;

  const foodFactor =
    FACTORS.food[dietType] ?? 75;

  const transportation = round(
    dailyTravelKm *
      transportFactor *
      30
  );

  const electricity = round(
    monthlyElectricityKwh *
      FACTORS.electricity
  );

  const food = round(foodFactor);

  const digital = round(
    dailyDigitalHours *
      FACTORS.digital *
      30
  );

  const total = round(
    transportation +
      electricity +
      food +
      digital
  );

  const score = Math.min(
    100,
    Math.max(
      0,
      Math.round((total / 333) * 50)
    )
  );

  const treesRequired = Math.ceil(
    total / (21.77 / 12)
  );

  return {
    transportation,
    electricity,
    food,
    digital,
    total,
    score,
    treesRequired,
  };
};

const getPersona = (emissions) => {
  const {
    transportation,
    electricity,
    food,
    digital,
    total,
  } = emissions;

  if (total < 150) {
    return 'green-pioneer';
  }

  if (electricity > 100) {
    return 'energy-consumer';
  }

  if (
    transportation > food &&
    transportation > digital
  ) {
    return 'daily-commuter';
  }

  if (
    digital > transportation &&
    digital > food
  ) {
    return 'digital-nomad';
  }

  if (
    food > transportation &&
    food > digital
  ) {
    return 'meat-lover';
  }

  return 'green-pioneer';
};

module.exports = {
  calculateEmissions,
  getPersona,
};