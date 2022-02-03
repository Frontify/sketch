import tinycolor2 from "tinycolor2";

export default async function() {
  let palettes = [
    {
      name: "Default Palette",
      id: 0,
      colors: []
    },
    {
      name: "Another Palette",
      id: 2,
      colors: []
    }
  ];
  let colors = ["#c5a9e3", "#e3b8ed", "#eeb6db", "#f2b7ce", "#e1c2ce"];
  palettes.forEach(palette => {
    colors.forEach(async (value, index) => {
      let color = tinycolor2(value);

      var name = "Unnamed #" + index;
      palette.colors.push({
        name: name,
        id: Math.random(),
        hex: color.toHex(),
        r: color.toRgb().r,
        g: color.toRgb().g,
        b: color.toRgb().b,
        opacity: color.toRgb().a * 100,
        opacity_css: color.toRgb().a
      });
    });
  });
  return palettes;
}
