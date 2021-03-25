import { createCanvas, loadImage, registerFont } from "canvas";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import drawMultilineText from "canvas-multiline-text";
import path from "path";

registerFont("public/ttf/jetbrainsmono-wght.ttf", { family: "Jetbrains" });

export const generateOgImage = async ({ slug, title }) => {
  const dir = path.resolve("public", "og");
  const filepath = path.resolve(dir, `${slug}.png`);

  if (!existsSync(dir)) {
    mkdirSync(dir);
  }

  if (!existsSync(filepath)) {
    const imgBuffer = await createImage({ title });

    writeFileSync(filepath, imgBuffer);
  }
};

export const createImage = async ({ title }) => {
  const width = 1200;
  const height = 630;

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  context.fillStyle = "#1A2334";
  context.fillRect(0, 0, width, height);

  const image = await loadImage("public/img/og-template.png");
  context.drawImage(image, 0, 0);

  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillStyle = "#000";

  drawMultilineText(context, title, {
    rect: {
      x: 600,
      y: 380,
      width: canvas.width - 20,
      height: canvas.height - 170,
    },
    font: "Jetbrains",
    verbose: false,
    lineHeight: 1.4,
    minFontSize: 15,
    maxFontSize: 56,
  });

  context.fillStyle = "#044AFD";
  context.font = "22px Jetbrains";
  context.fillText("mamuso.dev", 600, 580);

  return canvas.toBuffer("image/png");
};

const wadus = async function () {
  const slug = "og-image-test";
  const title = "mamuso.dev";

  await generateOgImage({ slug, title });
};

wadus();
console.log("wadus");
