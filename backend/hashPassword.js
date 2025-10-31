import bcrypt from "bcrypt";

const password = "vijaykumar"; // your real password
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then((hash) => {
  console.log("✅ Hashed Password:");
  console.log(hash);
});
