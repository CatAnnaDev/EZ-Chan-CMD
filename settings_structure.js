module.exports = [
    {
        "key": "enabled",
        "name": "Enable Module",
        "type": "bool"
    },
    {
        "key": "longTele",
        "name": "Enable Long Tele",
        "type": "bool"
    },
    {
        "key": "maxDistance",
        "name": "Max distance",
        "type": "range",
        "min": 1000,
        "max": 5000,
        "step": 1
    },
    {
        "key": "longTeleHoldMs",
        "name": "Waitting time for Long Tele",
        "type": "range",
        "min": 400,
        "max": 1500,
        "step": 1
    }
];
