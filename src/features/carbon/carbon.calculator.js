const FACTORS = {
  transport: { car: 0.21, bike: 0.008, public: 0.089, walking: 0.001, wfh: 0 },
  electricity: 0.41,
  food: { vegan: 45, vegetarian: 75, omnivore: 114, 'meat-heavy': 180 },
  digital: 0.036,
};

const calculateEmissions = (profile) => {
  const transportMode = profile.transportMode || 'walking';
  const dailyTravelKm = profile.dailyTravelKm || 0;
  const monthlyElectricityKwh = profile.monthlyElectricityKwh || 0;
  const dietType = profile.dietType || 'vegetarian';
  const dailyDigitalHours = profile.dailyDigitalHours || 0;

  const transportation = dailyTravelKm * (FACTORS.transport[transportMode] || 0) * 30;
  const electricity = monthlyElectricityKwh * FACTORS.electricity;
  const food = FACTORS.food[dietType] || 75;
  const digital = dailyDigitalHours * FACTORS.digital * 30;
  
  const total = transportation + electricity + food + digital;
  const score = Math.min(100, Math.round((total / 333) * 50));
  const treesRequired = Math.ceil(total / (21.77 / 12));

  return {
    transportation,
    electricity,
    food,
    digital,
    total,
    score,
    treesRequired
  };
};

const getPersona = (emissions) => {
  const { transportation, electricity, food, digital, total } = emissions;

  if (total < 150) {
    return 'green-pioneer';
  }
  if (electricity > 100) {
    return 'energy-consumer';
  }
  if (transportation > food && transportation > digital) {
    return 'daily-commuter';
  }
  if (digital > transportation && digital > food) {
    return 'digital-nomad';
  }
  if (food > transportation && food > digital) {
    return 'meat-lover';
  }
  return 'green-pioneer';
};

module.exports = {
  calculateEmissions,
  getPersona
};
