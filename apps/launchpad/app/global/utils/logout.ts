export default function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("address");
    localStorage.removeItem("wallet");
    localStorage.removeItem("signature");
  }
}
