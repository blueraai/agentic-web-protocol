export const html = `
<html ai-description="Travel site to book flights and trains">
  <body>
    <form class="form-booking-flight" ai-description="Form to book a flight">
      <h1 ai-description="Form description">
        Book a flight
      </h1>
      <label ai-description="Form query">
        Where to?
      </label>
      <input
        ai-ref="<input-ai-ref>"
        ai-description="Form input where to enter the destination"
        ai-interactions="input: enables the form confirmation button, given certain constraints;"
        type="text"
        id="destination"
        name="destination"
        required
        size="10"
        minlength="3"
        maxlength="30" />
      <div>
        <button
          ai-description="Confirmation button to proceed with booking a flight"
          ai-interactions="click: proceed; hover: diplay additonal information about possible flights;"
          ai-prerequisite-click="<input-ai-ref>: input destination;"
          ai-next-click="list of available flights; book a flight; login;"
          disabled>
          See available flights
        </button>
        <button
          ai-description="Cancel button to get back to the home page"
          ai-interactions="click: dismiss form and return to home page;"
          ai-next-click="access forms to book trains; access forms to book flights;">
          Back
        </button>
      </div>
    </form>
  </body>
</html>
`;