export const toPublicAccount = (account) => ({
  id: account.idAccount,
  username: account.username,
  email: account.email,
  role: account.role,
});
