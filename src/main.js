import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import pinia from "@/stores";

// 指令
// import installDirective from "@/directives";

const app = createApp(App);

// installDirective(app);
app.use(pinia);

app.mount("#app");
