import admin, { ServiceAccount } from "firebase-admin";
import config from "../config";
import { PreStartScript } from "./constructure";

class InitFirebaseAdmin extends PreStartScript {
  constructor() {
    super("Init Firebase Admin");
  }
  runScript() {
    console.debug("Initilizing the Firebase Admin");
    const serviceAccount = config.firebaseAdminServiceAccount;

    // Initialize the firebase admin
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
    console.debug("Successfully to initilize the Firebase Admin");
  }
}
export default InitFirebaseAdmin;
