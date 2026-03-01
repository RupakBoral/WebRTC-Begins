const generateSecureUUID = (): string => {
    return crypto.randomUUID();
};

export default generateSecureUUID;