import { createCanvas, loadImage, registerFont } from "canvas";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import drawMultilineText from "canvas-multiline-text";
import path from "path";

import { getAllPosts } from "./api";

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

  context.textAlign = "start";
  context.textBaseline = "bottom";
  context.fillStyle = "#FFF";

  drawMultilineText(context, title, {
    rect: {
      x: 128,
      y: 284,
      width: canvas.width - 240,
      height: 280,
    },
    font: "Jetbrains",
    verbose: false,
    lineHeight: 1.1,
    minFontSize: 64,
    maxFontSize: 120,
  });

  return canvas.toBuffer("image/png");
};

const ogGeneration = async function () {
  const allPosts = await getAllPosts(["title", "slug"]);

  allPosts.forEach(async (post) => {
    await generateOgImage({ slug: post.slug, title: post.title });
  });
};

ogGeneration();
