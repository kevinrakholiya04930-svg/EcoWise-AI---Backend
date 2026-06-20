const {
  normaliseProfileData,
  validateCompletionRequirements
} = require("../src/features/onboarding/onboarding.service");

describe("Onboarding Service", () => {
  it("should normalize profile", () => {
    const profile = normaliseProfileData({
      city: "Surat",
      transportMode: "car",
      dailyTravelKm: 20
    });

    expect(profile.city).toBe("Surat");
    expect(profile.transportMode).toBe("car");
  });

  it("should validate complete profile", () => {
    expect(() => {
      validateCompletionRequirements({
        city: "Surat",
        transportMode: "car",
        dailyTravelKm: 20,
        monthlyElectricityKwh: 300,
        dietType: "vegetarian",
        dailyDigitalHours: 5,
        sustainabilityGoal: "awareness"
      });
    }).not.toThrow();
  });
});