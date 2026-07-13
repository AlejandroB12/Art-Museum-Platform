const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

function preHash(data) {

    return crypto.createHash('sha256').update(data, 'utf-8').digest('hex');
}

async function hash(data) {
    
    if (!data || typeof data !== 'string') 
    {
        throw new Error('El dato no puede estar vacío.');
    }

    const preHashed = preHash(data);
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
        return bcrypt.hash(preHashed, salt);
}

async function verify(plainData, hashedData) 
{
    try 
    {
        const preHashed = preHash(plainData);
            return await bcrypt.compare(preHashed, hashedData);
    } 

    catch 
    {
        return false;
    }
}

module.exports = { hash, verify };
