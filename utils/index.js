const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

//Necessary for issuing the jwt
const pathToKey = path.join(__dirname, "../", 'id_rsa_priv.pem')
const pathToKeyPub = path.join(__dirname, "../", 'id_rsa_pub.pem')

// console.log(pathToKey)
const PRIV_KEY = fs.readFileSync(pathToKey, 'utf8');
const PUB_KEY = fs.readFileSync(pathToKeyPub, 'utf8');

const issueJWT = (user) => {
    const _id = user._id;
    const expiresIn = '1';
  
    const payload = {
        sub: _id,
        iat: Date.now()
    };
    const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, { expiresIn: expiresIn, algorithm: 'RS256' });
  
    return {
        token: "Bearer " + signedToken,
        expires: expiresIn
    }
}

const genPassword = async (plaintextPassword) => {
    console.log("works ")
    const saltRounds = 10;
    const hash = await bcrypt.hash(plaintextPassword, saltRounds);
    return hash
};

const verifyUser = (req, res) => {
    const authHeader = req.headers['authorization']
    const idToken = authHeader && authHeader.split(' ')[1]
    if (idToken == null) return res.sendStatus(401)

    return jsonwebtoken.verify(idToken, PUB_KEY)
}

module.exports = {
    issueJWT, 
    genPassword,
    verifyUser
}

