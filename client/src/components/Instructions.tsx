import { Accordion } from "@/components";

export const Instructions = () => {
  return (
    <>
      <Accordion title="How do I plant crops?">
        <p className="p2">
          <b>Step 1: Click the "View Garden" sign.</b> This opens your Garden so that you can plant crops and buy seeds
          and decorations.
        </p>
        <p className="p2">
          <b>Step 2: Click the plus (+) button in the "Crops" section and click the carrot seed.</b> Congrats! You've
          planted your first crop.
        </p>
        <p className="p2">
          <b>Step 3: Wait a minute and click a carrot in your garden to water it.</b> Once it's ready to water, click
          the "Water" button.
        </p>
        <p className="p2">
          <b>Step 4: Harvest that carrot!</b> Click the "Harvest" button from the same page you watered your plant.
        </p>
      </Accordion>

      <Accordion title="How do I buy new seeds and decorations?">
        <p className="p2">
          <b>Step 1: Click the "View Garden" sign.</b>
        </p>
        <p className="p2">
          <b>Step 2: Click the "View Store" button.</b>
        </p>
        <p className="p2">
          <b>Step 3a: Click the "Seeds" tab.</b> Click the "Buy" button once you have enough gold. After you buy a new
          seed, you own it forever and can plant it in your garden by clicking the plus (+) button on a Crop slot.
        </p>
        <p className="p2">
          <b>Step 3b: Click the "Decorations" tab.</b> Click the "Buy" button once you have enough gold. After you get a
          new decoration, you can click the plus (+) button to place it in a Decoration slot.
        </p>
      </Accordion>

      <Accordion title="How do I remove decorations and seeds?">
        <p className="p2">
          <b>Step 1: Click the "View Garden" sign.</b>
        </p>
        <p className="p2">
          <b>Step 2: Click a slot in your garden where a decoration or crop has been added. </b>
        </p>
        <p className="p2">
          <b>Step 3: Click the "Remove" button.</b> This will free up the slot so that you can add something else there.
        </p>
      </Accordion>

      <Accordion title="How do I buy new tools?">
        <p className="p2">
          <b>Step 1: Click the "View Garden" sign.</b>
        </p>
        <p className="p2">
          <b>Step 2: Click the "View Store" button. </b>
        </p>
        <p className="p2">
          <b>Step 3: Click the "Tools" tab.</b> Click the "Buy" button once you have enough gold. If you buy Sprinklers
          or Harvest Baskets, you can click one of the actions next to "Garden Plot" to use them.
          <img
            className="mb-1"
            src="https://sdk-grow-together.s3.us-east-1.amazonaws.com/usePlotTools.jpg"
            alt="Plot Tools"
          />
          If you buy Compost or Mulch, you can click the plus (+) button on a Crop slot to use it. Watering Cans can
          only be used on friends' crops.
        </p>
      </Accordion>

      <Accordion title="How do I use tools?">
        <p className="p2">
          <b>Step 1: Click the "View Garden" sign.</b>
        </p>
        <p className="p2">
          <b>Step 2a: To use Sprinklers or Harvest Baskets,</b> click one of the actions next to "Garden Plot" to use
          them. These can only be used on your garden.
          <img src="https://sdk-grow-together.s3.us-east-1.amazonaws.com/usePlotTools.jpg" alt="Plot Tools" />
        </p>
        <p className="p2">
          <b>Step 2b: To use Compost or Mulch,</b> click a planted crop. Then click "Use Tool" and select a tool.
          <img src="https://sdk-grow-together.s3.us-east-1.amazonaws.com/useTools.jpg" alt="Plot Tools" />
        </p>
        <p className="p2">
          <b>To use Watering Cans,</b> follow step 2b at friend's garden. Watering Cans can only be used on friends
          crops, but you will be rewarded for helping them.
        </p>
      </Accordion>
    </>
  );
};

export default Instructions;
