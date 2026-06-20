const {
  calculateEmissions
} = require("../src/features/carbon/carbon.calculator");

describe("Carbon Calculator", () => {
  it("should calculate transportation emissions", () => {
    const result = calculateEmissions({
      transportMode: "car",
      dailyTravelKm: 20,
      monthlyElectricityKwh: 0,
      dietType: "vegetarian",
      dailyDigitalHours: 0
    });

    expect(result.transportation).toBeGreaterThan(0);
  });

  it("should calculate electricity emissions", () => {
    const result = calculateEmissions({
      transportMode: "walking",
      dailyTravelKm: 0,
      monthlyElectricityKwh: 300,
      dietType: "vegetarian",
      dailyDigitalHours: 0
    });

    expect(result.electricity).toBeGreaterThan(0);
  });

  it("should return total emissions", () => {
    const result = calculateEmissions({
      transportMode: "car",
      dailyTravelKm: 20,
      monthlyElectricityKwh: 300,
      dietType: "omnivore",
      dailyDigitalHours: 5
    });

    expect(result.total).toBeGreaterThan(0);
  });
});