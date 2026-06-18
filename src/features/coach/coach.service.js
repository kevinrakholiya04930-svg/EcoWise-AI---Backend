const CarbonEntry = require('../carbon/carbon.model');
const User = require('../user/user.model');
const { calculateEmissions } = require('../carbon/carbon.calculator');

const RESPONSES = {
  greet: [
    "Hello {{name}}! I'm EcoWise, your personal sustainability companion. How can I help you reduce your environmental footprint today?",
    "Hey {{name}}! Great to see you back. Ready to check your impact or find some quick tips to save carbon?"
  ],
  explain_score: [
    "Your current carbon score is **{{score}}/100** (where lower is better). It is calculated relative to global and regional benchmarks. Based on your profile, you are currently rated as a **{{persona}}**. To lower your score further, we should focus on your highest emission category, which is **{{topCategory}}**."
  ],
  recommend: [
    "Looking to reduce? Here are a couple of high-impact actions you can take today:\n\n1. **{{action1}}**\n2. **{{action2}}**\n\nEach of these simple habits will help lower your carbon score and move you closer to your goals!"
  ],
  predict: [
    "Looking at your past weeks, if you continue on this path, you are projected to emit **{{projection}} kg CO₂** over the next month. However, if you adopt our recommended goal of a 25% reduction, you could save **{{savings}} kg CO₂**, which is equivalent to planting **{{trees}} trees**! Let's work towards that."
  ],
  challenge: [
    "I've got a challenge for you this week: **{{challengeTitle}}**! Completing this will save about **{{challengeSaving}} kg CO₂** and earn you **{{points}} points**. Are you up for it? Go to the Achievements section to start!"
  ],
  fallback: [
    "I understand. As your EcoWise companion, I'm here to track your progress and guide you. You can ask me to 'recommend tips', 'explain my score', or 'give me my weekly report'!"
  ]
};

const getRecommendationTips = (profile) => {
  const tips = {
    car: [
      { text: "Try carpooling or public transit 2 days a week to save ~40 kg CO₂/month.", saving: 40 },
      { text: "Keep tires properly inflated to improve fuel efficiency by up to 3%.", saving: 8 }
    ],
    bike: [
      { text: "Great job using a bike! Keep it up to maintain your low transport footprint.", saving: 0 }
    ],
    public: [
      { text: "Public transit is excellent. Try combining trips to reduce total travel distance.", saving: 5 }
    ],
    wfh: [
      { text: "Working from home saves significant emissions. Make sure your home workspace is energy-efficient.", saving: 10 }
    ],
    diet: {
      'meat-heavy': [
        { text: "Introduce 'Meatless Mondays' - skipping meat one day a week saves ~15 kg CO₂/month.", saving: 15 },
        { text: "Switch from beef to chicken/pork to reduce food footprint by 50%.", saving: 25 }
      ],
      omnivore: [
        { text: "Swap dairy products for oat or almond milk to save ~10 kg CO₂/month.", saving: 10 },
        { text: "Plan meals to avoid food waste, which contributes to landfill methane emissions.", saving: 8 }
      ],
      vegetarian: [
        { text: "Try going fully vegan two days a week to lower food impact further.", saving: 8 }
      ],
      vegan: [
        { text: "Amazing job with your plant-based diet! Your food footprint is already optimal.", saving: 0 }
      ]
    },
    energy: [
      { text: "Lower your air conditioning thermostat by 2°C to save ~25 kg CO₂/month.", saving: 25 },
      { text: "Unplug standby electronics to save up to 10% on your electricity bill.", saving: 12 }
    ],
    digital: [
      { text: "Stream in HD instead of 4K to reduce data center and transmission energy by 75%.", saving: 5 },
      { text: "Clean out your email inbox and delete old cloud backups.", saving: 2 }
    ]
  };

  const selected = [];
  
  // Transport tips
  if (profile.transportMode === 'car') {
    selected.push(tips.car[0]);
  } else {
    selected.push(tips[profile.transportMode][0]);
  }

  // Diet tips
  const dietTips = tips.diet[profile.dietType];
  if (dietTips && dietTips.length > 0) {
    selected.push(dietTips[0]);
  }

  // Energy
  if (profile.monthlyElectricityKwh > 100) {
    selected.push(tips.energy[0]);
  }

  // Digital
  if (profile.dailyDigitalHours > 4) {
    selected.push(tips.digital[0]);
  }

  return selected.filter(Boolean);
};

const handleChat = async (userId, message) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const history = await CarbonEntry.find({ userId }).sort({ week: -1 });
  const latestEntry = history[0];
  const baseline = calculateEmissions(user.profile);
  const totalEmissions = latestEntry ? latestEntry.emissions.total : baseline.total;
  const carbonScore = latestEntry ? latestEntry.carbonScore : baseline.score;

  // Determine top category
  let emissionsBreakdown = latestEntry ? latestEntry.emissions : baseline;
  let topCategory = 'electricity';
  let maxVal = 0;
  for (let cat of ['transportation', 'electricity', 'food', 'digital']) {
    if (emissionsBreakdown[cat] > maxVal) {
      maxVal = emissionsBreakdown[cat];
      topCategory = cat;
    }
  }

  // Classify intent
  const msgLower = message.toLowerCase();
  let intent = 'fallback';

  if (msgLower.includes('hello') || msgLower.includes('hi') || msgLower.includes('hey')) {
    intent = 'greet';
  } else if (msgLower.includes('score') || msgLower.includes('why is my') || msgLower.includes('explain')) {
    intent = 'explain_score';
  } else if (msgLower.includes('recommend') || msgLower.includes('tip') || msgLower.includes('reduce') || msgLower.includes('save')) {
    intent = 'recommend';
  } else if (msgLower.includes('predict') || msgLower.includes('projection') || msgLower.includes('future')) {
    intent = 'predict';
  } else if (msgLower.includes('challenge') || msgLower.includes('mission')) {
    intent = 'challenge';
  }

  // Select templates
  const templates = RESPONSES[intent];
  const template = templates[Math.floor(Math.random() * templates.length)];

  // Get tips
  const tips = getRecommendationTips(user.profile);
  const action1 = tips[0] ? tips[0].text : 'Unplug unused electronics';
  const action2 = tips[1] ? tips[1].text : 'Eat more plant-based meals';

  // Format templates
  let response = template
    .replace('{{name}}', user.name)
    .replace('{{score}}', carbonScore)
    .replace('{{persona}}', user.persona)
    .replace('{{topCategory}}', topCategory)
    .replace('{{action1}}', action1)
    .replace('{{action2}}', action2)
    .replace('{{projection}}', Math.round(totalEmissions * 4))
    .replace('{{savings}}', Math.round(totalEmissions))
    .replace('{{trees}}', Math.ceil(totalEmissions / 21.77))
    .replace('{{challengeTitle}}', topCategory === 'transportation' ? 'Car-Free Commute' : 'Meatless Day')
    .replace('{{challengeSaving}}', topCategory === 'transportation' ? '5.4' : '2.3')
    .replace('{{points}}', '100');

  // Record points for chatting (daily cap in prod but simple +5 points here)
  user.gamification.greenPoints += 5;
  await user.save();

  return response;
};

const getWeeklyReport = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const history = await CarbonEntry.find({ userId }).sort({ week: -1 }).limit(2);
  const currentEntry = history[0];
  const prevEntry = history[1];

  let name = user.name;
  let pctDiff = 0;
  let reportText = "";

  if (currentEntry && prevEntry) {
    const currTotal = currentEntry.emissions.total;
    const prevTotal = prevEntry.emissions.total;
    pctDiff = ((currTotal - prevTotal) / prevTotal) * 100;
  }

  const statusStr = pctDiff < 0 
    ? `emitted **${Math.abs(Math.round(pctDiff))}% less** than last week — excellent progress!` 
    : pctDiff > 0 
      ? `emitted **${Math.round(pctDiff)}% more** than last week. Let's see how we can optimize.`
      : `held steady compared to last week. Let's aim to push it down next week!`;

  const baseline = calculateEmissions(user.profile);
  const activeBreakdown = currentEntry ? currentEntry.emissions : baseline;
  
  // Emotional equivalents
  const flights = (activeBreakdown.total / 250).toFixed(1); // 250kg = short flight
  const drivingKm = Math.round(activeBreakdown.total / 0.21);
  const phones = Math.round(activeBreakdown.total / 0.007);
  const trees = Math.ceil(activeBreakdown.total / 1.8);

  reportText = `
# Weekly Sustainability Report for ${name}

### 📊 Performance Summary
This week, you ${statusStr} Your total carbon footprint was **${Math.round(activeBreakdown.total)} kg CO₂**, giving you a Carbon Score of **${currentEntry ? currentEntry.carbonScore : baseline.score}/100**.

### 🌟 Emotional Equivalents
To put that into perspective, your weekly emissions are equivalent to:
* ✈️ **${flights} flights** between Delhi and Mumbai
* 🚗 Driving **${drivingKm} km** in a standard petrol car
* 📱 Charging a smartphone **${phones.toLocaleString()} times**
* 🌳 Requiring **${trees} trees** to work for an entire month to absorb this impact

### 🔍 Breakdown Analysis
* 🚗 **Transportation**: ${Math.round(activeBreakdown.transportation)} kg CO₂
* ⚡ **Electricity**: ${Math.round(activeBreakdown.electricity)} kg CO₂
* 🍔 **Food**: ${Math.round(activeBreakdown.food)} kg CO₂
* 💻 **Digital**: ${Math.round(activeBreakdown.digital)} kg CO₂

Your biggest footprint came from **${activeBreakdown.transportation > activeBreakdown.electricity && activeBreakdown.transportation > activeBreakdown.food ? 'Transportation' : activeBreakdown.electricity > activeBreakdown.food ? 'Electricity' : 'Food'}**.

### 🎯 Recommended Target for Next Week
Based on your peak areas, try implementing:
1. **Reduce Standby Power**: Switch off appliances at the wall sockets.
2. **Swap One Ride**: Walk or bike for any trip under 3km.
`;

  return reportText;
};

module.exports = {
  handleChat,
  getWeeklyReport
};
