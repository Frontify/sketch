export default async function() {
  let palettes = [
    {
      id: 1,
      name: "Default",
      styles: []
    },
    {
      id: 2,
      name: "Another palette",
      styles: []
    }
  ];

  palettes.forEach(palette => {
    for (var i = 0; i < 10; i++) {
      palette.styles.push({
        id: Math.random(),
        name: "Random Style #" + i,
        align: oneOf(["left", "right", "center", null]),
        decoration: oneOf([null, "underline", "line-through"]),
        family: oneOf(["Monaco", "Roboto", "Times New Roman"]),
        line_height: 1 + Math.random(),
        line_height_unit: null,
        paragraphIndent: 0,
        paragraphSpacing: 0,
        style: oneOf([null, "normal", "italic"]),
        spacing: Math.random() * 10,
        spacing_unit: "px",
        size: Math.random() * 40,
        size_unit: "px",
        transform: oneOf(["uppercase", "lowercase", null, "capitalize"]),
        weight: oneOf([null, "Regular", "Bold"]),
        colors: [
          {
            label: "Green",
            color: {
              r: 0,
              g: 255,
              b: 0,
              opacity_css: 1,
              hex: "00ff00"
            }
          },
          {
            label: "Red",
            color: {
              r: 255,
              g: 0,
              b: 0,
              opacity_css: 1,
              hex: "ff0000"
            }
          }
        ]
      });
    }
  });
  return palettes;
}

function oneOf(items) {
  return items[Math.floor(Math.random() * items.length)];
}
