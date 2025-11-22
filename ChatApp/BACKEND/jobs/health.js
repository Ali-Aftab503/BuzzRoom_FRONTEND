import axios from "axios";
import cron from "node-cron";

export function health() {
  cron.schedule(
    "*/1 * * * *",
    async () => {
      try {
        await axios.get("https://buzzroom-backend-cs9t.onrender.com/health");
        console.log("😌😌😌😌 [health-check] Successfull 😌😌😌😌 ", new Date().toTimeString().split(" ")[0]);
      } catch (error) {
        console.log("😰😰😰😰😰 [health-check] API call failed 😰😰😰😰😰");
        console.log(error);
      }
    },
    { timezone: "UTC" } // Set your timezone if needed
  );
}
