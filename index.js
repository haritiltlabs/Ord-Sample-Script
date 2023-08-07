const { exec } = require("child_process");
const axios = require("axios");
const { parse } = require("node-html-parser");

async function getInscriptionHolder(inscriptionId) {
  // Replace https://ordinals.com with below to connect with local ord server
  //http://0.0.0.0:7545
  let res = await axios
    .get(`https://ordinals.com/inscription/${inscriptionId}`)
    .catch((e) => {
      console.log(e);
    });
  const htmlRes = parse(res.data);
  const userAddress = htmlRes.querySelectorAll(".monospace");
  const outUtxo = userAddress[4].text;
  const currentOwner = userAddress[1].text;
  const gentransaction = userAddress[2].text;
  let res2 = await axios
    .get(`https://ordinals.com/tx/${gentransaction}`)
    .catch((e) => {
      console.log(e);
    });
  const htmlRes2 = parse(res2.data);
  const filter = htmlRes2.querySelectorAll(".monospace");
  const inscriptor = filter[filter.length - 1].text;

  return { currentOwner, outUtxo, inscriptor };
}
async function getOwnerHistory(utxo, currentOwner, inscriptor) {
  let owners = [];
  let c_owner = currentOwner;
  owners.push(currentOwner);
  //http://0.0.0.0:7545
  if (currentOwner == inscriptor) {
    return owners;
  } else {
    let res = await axios
      .get(`https://ordinals.com/output/${utxo}`)
      .catch((e) => {
        console.log(e);
      });
    const htmlRes = parse(res.data);
    const filter = htmlRes.querySelectorAll(".monospace");
    const txid = filter[filter.length - 2].text;
    let res2 = await axios.get(`https://ordinals.com/tx/${txid}`).catch((e) => {
      console.log(e);
    });
    const htmlRes2 = parse(res2.data);
    const filter2 = htmlRes2.querySelectorAll(".monospace");
    const txutxo = filter2[1].text;
    let i = 0;
    let txid2;
    while (c_owner != inscriptor) {
      let res;
      if (i == 0) {
        i++;
        res = await axios
          .get(`https://ordinals.com/output/${txutxo}`)
          .catch((e) => {
            console.log(e);
          });
        const htmlRes3 = parse(res.data);
        const filter3 = htmlRes3.querySelectorAll(".monospace");
        const txid3 = filter3[filter3.length - 2].text;
        c_owner = txid3;
        txid2 = filter3[filter3.length - 1].text;
      } else {
        res = await axios.get(`https://ordinals.com/tx/${txid2}`).catch((e) => {
          console.log(e);
        });
        const htmlRes3 = parse(res.data);
        const filter3 = htmlRes3.querySelectorAll(".monospace");
        const utxo2 = filter3[1].text;
        let res4 = await axios
          .get(`https://ordinals.com/output/${utxo2}`)
          .catch((e) => {
            console.log(e);
          });
        const htmlRes4 = parse(res4.data);
        const filter4 = htmlRes4.querySelectorAll(".monospace");
        const txid4 = filter4[filter4.length - 2].text;
        if (c_owner == txid4) {
          continue;
        }
        c_owner = txid4;
        txid2 = filter4[filter4.length - 1].text;
      }

      owners.push(c_owner);
      console.log("PUSHED=>", c_owner);
    }
  }
  return owners;
}

//Uncomment below line in the server for getting ord wallet inscriptions
// exec(
//   `ord --rpc-url "127.0.0.1:8332" wallet inscriptions`,
//   async (error, stdout, stderr) => {
//     if (error) {
//       console.log(`error: ${error.message}`);
//       return;
//     }
//     if (stderr) {
//       console.log(`stderr: ${stderr}`);
//       return;
//     }
//     console.log("WALLET INSCRIPTIONS");
//     console.log(`stdout: ${stdout}`);
//   }
// );

async function main() {
  let INSCRIPTION_ID =
    "4e314a7f7181a524ba072ff8aad4008633d63b916b4eac13d0a04478cce65069i0";
  const { currentOwner, outUtxo, inscriptor } = await getInscriptionHolder(
    INSCRIPTION_ID
  );
  console.log(`OWNERADDRESS: ${currentOwner} INSCRIPTIONID: ${INSCRIPTION_ID}`);
  console.log(`INSCRIPTORADDRESS: ${inscriptor}`);
  let a = await getOwnerHistory(outUtxo, currentOwner, inscriptor);
  console.log("OWNERS ARRAY =>", a);
}

main().then(() => {
  console.log("Everything at top level executed!!!");
});
