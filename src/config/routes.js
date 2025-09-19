const routes = {
  login: "/",
  chat_manager: "/chat-manager/:configId",   // 👈 sửa lại
  ctv_chat: "/chat-manager/:configId/:ctvId",
  add_config: "/add-config",
  profile: "/profile",
  manager_page: "/manager-page",
  admin: "/admin",
};


export default routes;
