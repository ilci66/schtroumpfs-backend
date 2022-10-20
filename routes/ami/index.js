const express = require('express');
const router = express.Router();
const Schtroumpfs = require('../../model/smurf');
const { verifyUser } =  require('../../utils');


router.delete('/:nom', (req, res) => {
    const {nom} = req.params
    const decoded = verifyUser(req, res);

    Schtroumpfs.findOne({ _id: decoded.sub }, async (err, data) => {
        if(err) {
            console.error("err in adding", err)
            return res.status(400).json({ "error": "Une erreur s'est produite lors de la suppresion" })
        } else {
            console.log("data => ",data)
            if(data.friends.indexOf(nom) < 0) {
                console.log("not in list", err)
            } else {
                result = await Schtroumpfs.findOneAndUpdate({ _id: decoded.sub }, { friends: data.friends.filter(f => f != nom) }, { new: true })
                return res.status(200).json({friends: result.friends})
            }

        }
    })
})

router.post('/', (req, res) => {

    const { nomAmi} = req.body

    const decoded = verifyUser(req, res);

    console.log("wanna add", nomAmi, decoded.sub)

    Schtroumpfs.findOne({ _id: decoded.sub }, async (err, data) => {
        if(err) {
            console.error("err in adding", err)
            return res.status(401).json({ "error": "Une erreur s'est produite lors de l'ajout d'un ami" })
        } else {
            console.log("data => ",data)
            if(data.friends.indexOf(nomAmi) >= 0) {
                console.error("already in list", data.friends.indexOf(nomAmi))
                return res.status(400).json({ "error": "Ami déjà dans la liste" })
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

module.exports = router;
