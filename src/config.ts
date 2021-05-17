interface appConfig {
  appPort: Number;
  debug: boolean;
  database: {
    ip: String;
    port: Number;
    username: String;
    password: String;
  };
}

const config: appConfig = {
  /* App port determine the port that this API will be run */
  appPort: 6001,
  /* Debug Mode */
  debug: true,
  /* Database Credential */
  database: {
    ip: "localhost",
    port: 1,
    username: "root",
    password: "1234",
  },
};

export = config;
