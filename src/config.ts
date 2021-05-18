interface appConfig {
  /* App port determine the port that this API will be run */
  appPort: Number;
  /* Debug Mode */
  debug: boolean;
  /* Firebase Admin Service Account File*/
  firebaseAdminServiceAccount: string;
}

if (typeof process.env.TASERVICEACCOUNT === "undefined") {
  throw new Error("No serviceAccount found in the process environment");
}

const config: appConfig = {
  appPort: 6001,
  debug: true,
  firebaseAdminServiceAccount: process.env.TASERVICEACCOUNT,
};

export = config;
