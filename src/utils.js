function randomIpV4() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(
    Math.random() * 255,
  )}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

exports.request =
  typeof fetch === "undefined"
    ? (urlString, options = {}) => {
        return new Promise((resolve, reject) => {
          const urlObject = new URL(urlString);
          const protocol =
            urlObject.protocol === "https:"
              ? require("https")
              : require("http");

          const req = protocol.request(
            urlString,
            {
              ...options,
              headers: {
                ...options.headers,
                "X-Forwarded-For": randomIpV4()
              },
            },
            (res) => {
              let data = "";

              res.on("data", (chunk) => {
                data += chunk;
              });

              res.on("end", () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  resolve(data);
                } else {
                  reject(
                    new Error(
                      `Request for ${urlString} failed with status code ${res.statusCode}`,
                    ),
                  );
                }
              });
            },
          );

          req.on("error", (e) => {
            reject(new Error(`Problem with request: ${e.message}`));
          });

          if (options.body) {
            req.write(options.body);
          }

          req.end();
        });
      }
    : (urlString, options = {}) => {
        return new Promise(async (resolve, reject) => {
          try {
            new URL(urlString);
            try {
              const res = await fetch(urlString, {
                ...options,
                headers: {
                  ...options.headers,
                  "X-Forwarded-For": randomIpV4()
                },
              });
              try {
                resolve(await res.text());
              } catch (err) {
                reject(new Error(`Error parsing response from ${urlString}`));
              }
            } catch (err) {
              console.log(err);
              reject(new Error(`Request for ${urlString} failed. Reason: ${err}`));
            }
          } catch (err) {
            reject(err);
          }
        });
      };

