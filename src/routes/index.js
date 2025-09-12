import config from "~/config";
import AddConfigPage from "~/Pages/AddConfig/AddConfigPage";
import ChatManager from "~/Pages/ChatManager/ChatManager";
import Login from "~/Pages/Login/Login";
import ManagePage from "~/Pages/ManagePage/ManagePage";
import Profile from "~/Pages/Profile/Profile";

const publicRoutes = [
  { path: config.routes.chat_manager, component: ChatManager, layout: null },
  { path: config.routes.ctv_chat, component: ChatManager, layout: null },
  { path: config.routes.login, component: Login, layout: null },
  { path: config.routes.add_config, component: AddConfigPage, layout: null },
  { path: config.routes.profile, component: Profile },
  { path: config.routes.manager_page, component: ManagePage },
];

// truy cập riêng tư nếu không phải public thì chuyển hướng sang trang login
const privateRoutes = [];

export { publicRoutes, privateRoutes };
