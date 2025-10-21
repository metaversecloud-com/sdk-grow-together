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
          <b>Step 2a: Click the "Buy Seeds" button.</b> Click the "Buy" button once you have enough gold. After you buy
          a new seed, you own it forever and can plant it in your garden by clicking the plus (+) button on a Crop slot.
        </p>
        <p className="p2">
          <b>Step 2b: Click "Buy Decorations" button Click the "Buy" button once you have enough gold.</b> After you get
          a new decoration, you can click the plus (+) button to place it in a Decoration slot.
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
          <b>Step 2b: Click the "Remove" button.</b> This will free up the slot so that you can add something else
          there.
        </p>
      </Accordion>
    </>
  );
};

export default Instructions;
