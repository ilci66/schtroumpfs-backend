const express = require('express');
const jsonwebtoken = require('jsonwebtoken');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const Schtroumpfs = require('../../model/smurf');
const { issueJWT, genPassword, verifyUser } =  require('../../utils');

const pathToKeyPub = path.join(__dirname, "../../", 'id_rsa_pub.pem')

const PUB_KEY = fs.readFileSync(pathToKeyPub, 'utf8');

router.post('/verify', (req, res) => {
    const authHeader = req.headers['authorization']
    const idToken = authHeader && authHeader.split(' ')[1]
    if (idToken == null) return res.sendStatus(401)

    jsonwebtoken.verify(idToken, PUB_KEY, (err, data) => {
        if (err) return res.sendStatus(403)
        return res.sendStatus(200)
    })
})

router.get('/', (req, res) => {
    const decoded = verifyUser(req, res);

    Schtroumpfs.findOne({ _id: decoded.sub }, async (err, data) => {
        if(err) {
            console.error("err in adding", err)
            return res.status(400).json({"error": "Une erreur s'est produite lors de la récupération de l'utilisateur"})
        } else if(!data){
            console.error("data can't be found")
            return res.status(400).json({"error": "Utilisateur n'existe pas"})
        } else {
            const result = {
                nom: data.nom, 
                role: data.role, 
                friends: data.friends
            }
            return res.status(200).json(result)
        }
    })
})

router.get('/amis', (req, res) => {
    const { nom } = req.body;
    Schtroumpfs.find({nom}, (err, data) => {
        if(err) {
            console.error("err in get amis")
            return res.status(400).json({"error": "Une erreur s'est produite lors de la récupération des amis"})
        } else {
            console.log("gonna return", data)
            return res.status(200).json({data: data.friends})
        }
    })
})


router.post('/modifier', async (req, res) => {

    const decoded = verifyUser(req, res);

    if(!decoded) res.status(401).json({"error": "Jeton invalide"})

    const {nomAModifier, role, password} = req.body

    console.log("wanna edit", nomAModifier, role, password)

    const update = { nom: nomAModifier, role }
    
    Schtroumpfs.findOne({ _id: decoded.sub }, async (err, data) => {
        if(err) {
            console.log("err in adding", err)
            return res.status(401).json({"error": "Une erreur s'est produite lors de l'édition"})
        } else if(!data){
            console.log("data can't be found")
            return res.status(401).json({"error": "L'utilisateur est introuvable dans la base de données"})
        } else {
            console.log("data >=", data);
            const same = bcrypt.compare(password, data.password);
            if(!same) {
                res.status(401).json({"error": "Mauvais mot de passe"})
                return;
            } else {   
                const s = await Schtroumpfs.findOneAndUpdate({ _id: decoded.sub  }, update, { new: true})
                console.log("modified => ",s)
                return res.status(200).json({nom: s.nom, role: s.role, friends: s.friends});
            }
        }
    })

})

router.post('/sign-up', (req, res) => {
    console.log(req.body.nom, req.body.password, req.body.password2, req.body.role)
    const { nom, password, password2, role } = req.body;
    if (!req.body.nom || !req.body.password || !req.body.role) {
        console.log("no info sent")
        return res.status(400).json({ "error": "Fournir un nom"})
    } 
    if (password !== password2) {
        console.log("Passwords are not identical!")
        res.status(401).json({ error: "Les mots de passe ne correspondent pas!" })
        return
    }
    Schtroumpfs.findOne({ nom: nom}, async (err, data) => {
        if(err) {
            console.error("err in sign up")
            return res.status(400).json({ "error": `une erreur s'est produite dans la base de données` })
        } else if(data) {
            console.log("found in sign up")
            return res.status(400).json({ "error": "L'utilisateur existe dans la base de données" }) 
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
    console.log(nom, password)
    if(!nom) {
        console.log("no name")
        return res.status(400).json({ "error": "Fournissez un nom"})
    }
    if(!password) {
        console.log("no pwd")
        return res.status(400).json({ "error": "Fournissez un mot de passe"})
    }

    Schtroumpfs.findOne({ nom }, async (err, schtroumpf) => {
        if(err){
            return res.status(400).json({ "error": `une erreur s'est produite dans la base de données`})
        } else if (!schtroumpf) {
            return res.status(400).json({ "error": "vous avez entré le mauvais mot de passe ou nom"})
        } else {
            const valid = await bcrypt.compare(password, schtroumpf.password);
            
            if (!valid) {
                console.log("it's not valid")
                return res.status(400).json({ "error": "vous avez entré le mauvais mot de passe ou nom"}) 
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