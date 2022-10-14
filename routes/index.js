const express = require('express');
const jsonwebtoken = require('jsonwebtoken');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const passport = require('passport');
const Schtroumpfs = require('../model/smurf')


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
    const hash = await bcrypt.hash(plaintextPassword, saltRounds)
    return hash
};

const verifyUser = (req, res) => {
    const authHeader = req.headers['authorization']
    const idToken = authHeader && authHeader.split(' ')[1]
    if (idToken == null) return res.sendStatus(401)

    return jsonwebtoken.verify(idToken, PUB_KEY)
}

router.post('/verify', (req, res) => {
    const authHeader = req.headers['authorization']
    const idToken = authHeader && authHeader.split(' ')[1]
    if (idToken == null) return res.sendStatus(401)

    jsonwebtoken.verify(idToken, PUB_KEY, (err, data) => {
        if (err) return res.sendStatus(403)
        return res.sendStatus(200)
    })
})

router.get('/get-all', (req, res) => {
    Schtroumpfs.find(async (err, data) => {
        if(err) {
            console.error("err in get all")
            return res.status(400)
        } else {
            let result = []
            await data.map(d => result.push({nom: d.nom, role: d.role}))
            res.status(200).json({ schtroumpf: result })
        }
    })
})

router.get('/user', (req, res) => {
    const decoded = verifyUser(req, res);

    Schtroumpfs.findOne({ _id: decoded.sub }, async (err, data) => {
        if(err) {
            console.error("err in adding", err)
            return res.status(400)
        } else if(!data){
            console.error("data can't be found")
            return res.status(400)
        } else {
            const result = {
                nom: data.nom, 
                role: data.role, 
                friends: data.friends
            }
            console.log("user =< ", result,"data=<",  data)
            return res.status(200).json(result)
        }
    })
})

router.get('/amis', (req, res) => {
    const { nom } = req.body;
    Schtroumpfs.find({nom}, (err, data) => {
        if(err) {
            console.error("err in get amis")
            return res.status(400)
        } else {
            console.log("gonna return", data)
            return res.status(200).json({data: data.friends})
        }
    })
})

router.post('/enlever-ami', (req, res) => {
    const {nom, nomAmi} = req.body
    Schtroumpfs.find({ nom }, async (err, data) => {
        if(err) {
            console.error("err in adding", err)
            return res.status(400)
        } else {
            console.log("data => ",data)
            if(data[0].friends.indexOf(nomAmi) < 0) {
                console.log("not in list", err)
            } else {
                result = await Schtroumpfs.findOneAndUpdate({ nom: nom }, { friends: data[0].friends.filter(f => f != nomAmi) }, { new: true })
                return res.status(200).json({friends: result.friends})
            }

        }
    })
})

router.post('/ajout-ami', (req, res) => {

    const { nomAmi} = req.body

    const decoded = verifyUser(req, res);

    console.log("wanna add", nomAmi, decoded.sub)

    Schtroumpfs.findOne({ _id: decoded.sub }, async (err, data) => {
        if(err) {
            console.error("err in adding", err)
            return res.status(400)
        } else {
            console.log("data => ",data)
            if(data.friends.indexOf(nomAmi) >= 0) {
                console.error("already in list", err)
            } else {
                result = await Schtroumpfs.findOneAndUpdate({ _id: decoded.sub }, { friends: [...data.friends, nomAmi] }, { new: true })
                return res.status(200).json({ 
                    nom: result.nom, 
                    role: result.role, 
                    friends: result.friends 
                })
            }
        }
    })
})

router.post('/modifier', async (req, res) => {

    const decoded = verifyUser(req, res);

    if(!decoded) res.status(401).json()

    const {nomAModifier, role, password} = req.body

    console.log("wanna edit", nomAModifier, role, password)

    const update = { nom: nomAModifier, role }
    
    Schtroumpfs.findOne({ _id: decoded.sub }, async (err, data) => {
        if(err) {
            console.log("err in adding", err)
            return res.status(400)
        } else if(!data){
            console.log("data can't be found")
            return res.status(400)
        } else {
            console.log("data >=", data);
            const same = bcrypt.compare(password, data.password);
            if(!same) res.status(401)

            const s = await Schtroumpfs.findOneAndUpdate({ _id: decoded.sub  }, update, { new: true})
            console.log("modified => ",s)
            return res.status(200).json({nom: s.nom, role: s.role, friends: s.friends});
        }
    })

})



router.post('/sign-up', (req, res) => {
    console.log(req.body.nom, req.body.password, req.body.password2, req.body.role)
    const { nom, password, password2, role } = req.body;
    console.log("body >>>", req.body)
    console.log("these are recieved", nom, password, password2, role)
    if (!req.body.nom || !req.body.password || !req.body.role) {
        console.log("no info sent")
        return res.status(400).json({ error: "Provide a name"})
    } 
    if (password !== password2) {
        console.log("Passwords are not identical!")
        res.status(401).json({ error: "Passwords are not identical!" })
        return
    }
    Schtroumpfs.findOne({ nom: nom}, async (err, data) => {
        if(err) {
            console.error("err in sign up")
            return res.status(400).json({ error: `an error occured: ${err}` })
        } else if(data) {
            console.log("found in sign up")
            return res.status(400).json({ error: "User exists in database" }) 
        } else {
            console.log("well no err until here")
            const passwordToSave = await genPassword(password);
            const schtroumpf = new Schtroumpfs({
                nom: nom,
                password: passwordToSave,
                role: role
            });

            schtroumpf.save()
                .then(async schtroumpf => {
                    console.log("registered new user")
                    const jwt = await issueJWT(schtroumpf)
                    res.status(201).json(
                        {
                            token: jwt.token,
                            expiresIn: jwt.expires
                        }
                    )

                })
        }
        
    })
})

router.post('/sign-in', (req, res) => {
    const { nom, password } = req.body;

    if(!nom) {
        console.log("no name")
        return res.status(400).json({ error: "Provide a name"})
    }
    if(!password) {
        console.log("no pwd")
        return res.status(400).json({ error: "Provide a password"})
    }

    Schtroumpfs.findOne({ nom}, async (err, schtroumpf) => {
        if(err){
            return res.status(400).json({ error: `an error occured: ${err}`})
        } else if (!schtroumpf) {
            return res.status(400).json({ error: "unknown name"})
        } else {
            console.log("found the schtroumpf", schtroumpf.password)
            const valid = await bcrypt.compare(password, schtroumpf.password);
            
            if (!valid) {
                console.log("it's not valid")
                return res.status(400).json({ error: "Wrong password"}) 
            } else {
                const tokenObj =  issueJWT(schtroumpf)
                res.status(200).json({ 
                        token: tokenObj.token, 
                        expiresIn: tokenObj.expires 
                    }
                  );
            } 
        }
    })
});

module.exports = router;
