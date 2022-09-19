module.exports = {
    empty : (req, res) => {
        if (req.body.account == "" || req.body.pass == "")
            return true;
        return false;
    }
}

