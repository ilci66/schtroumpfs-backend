const express = require('express');
const router = express.Router();
const Schtroumpfs = require('../../model/smurf')


router.get('/all', (req, res) => {
    Schtroumpfs.find(async (err, data) => {
        if(err) {
            console.error("err in get all")
            return res.status(400).json({"error": "Une erreur s'est produite lors de la récupération de tous les utilisateurs"})
        } else {
            let result = []
            await data.map(d => result.push({nom: d.nom, role: d.role}))
            res.status(200).json({ schtroumpf: result })
        }
    })
})



module.exports = router;
