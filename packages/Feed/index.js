const { Template, Contracts } = require("../Base");
const { ethers } = require("ethers");
const { hexlify } = require("../Utils");
const ErasureHelper = require("@erasure/crypto-ipfs")
const onlyHash = ErasureHelper.ipfs.onlyHash

class Feed extends Template {
  /**
   * @param {} feedAddress
   * @param {*} wallet
   * @param {*} provider
   */
  constructor(opts) {
    super({contract:Contracts.Feed, ...opts});
  }

  /**
   * Submit proofHash to add to feed
   * @param {*} param0 : proof is normally an IPFS hash
   */
  async submitProof(proof) {
    const proofHash = ethers.utils.keccak256(hexlify(proof));
    let tx = await this.contract.submitHash(proofHash);
    return await tx.wait();
  }

  /**
   *Override setMetadata method because Feed creator can also set metadata
   * @param {*} data
   */
  async setMetadata(data) {
    const feedMetadata = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data));
    let tx = await this.contract.setMetadata(feedMetadata);
    return await tx.wait();
  }

   /**
   * 1. Create symkey
   * 2. Encrypt data with symkey
   * 3. Create MetaData of ipfs hash of data,encryptedData,key
   * 4. create ipfs hash of metadata and push hash to feed
   * 5. push encryptedData and proofHash to ipfs
   * @param {raw data} rawData 
   * @param {any msg to sign } msg 
   * @param {salt} salt 
   * @param {optional description} description 
   */

  async createPost( rawData) {

    //create symkey
    const symKey = ErasureHelper.crypto.symmetric.generateKey()
    const keyHash = await onlyHash(symKey) //ipfs path for symkey (for revealing later)

    //encrypt file with symkey and post to ipfs
    const rawDataHash = await onlyHash(rawData) //ipfs path for raw data (for revealing later)
    const dataEncoded = b64.encode(rawData)
    const encrytpedData = ErasureHelper.crypto.symmetric.encryptMessage(symKey, dataEncoded)
    const encryptedDataHash = await onlyHash(encrytpedData) //ipfs path for encrypted data
    const metadata = {
      address: this.wallet.address,
      rawDataHash,
      keyHash,
      encryptedDataHash
    }
    const proofHash = await onlyHash(metadata) //ipfs hash for metadata
    //submit proofHash to Feed
    let confirmedTx = await this.submitProof(proofHash)
    //save encrypted data file and metadata to ipfs
    const encryptedDataIpfsPath = await this.ipfs.add(encryptedData)
    assert.equal(encryptedDataIpfsPath, encryptedDataHash, "encrypted data ipfs hash are not the same")
    const proofHashIpfsPath = await this.ipfs.addJSON(metadata)
    assert.equal(proofHashIpfsPath, proofHash, "proof hash and ipfs path are not the same")
    return {symKey,confirmedTx}
  }
  //return bool of revealed or not
  async status(){
//TODO
  }
/**
   * Reveal all posts
   * @return Array of ipfs path to keys and metadata
   * //TODO get all posts from graph, check if reveal, if not -> reveal
   */
  async reveal({ symKey, rawData }) {
    const proofHashHex = await this.graph.getAllPosts(this.address())
    const proofIpfsHash = hexToHash(proofHashHex)
    const metadata = await this.ipfs.cat(proofIpfsHash)
    const symkeyIpfsPath = await onlyHash(symKey)
    assert.equal(symkeyIpfsPath, metadata.keyHash, "symkey ipfs path is not the same")
    const rawdataIpfsPath = await onlyHash(rawData)
    assert.equal(rawdataIpfsPath, metadata.rawDataHash), "raw data ipfs path is not the same")
    const symKeyIpfs = await this.ipfs.add(symKey)
    const rawDataIpfs = await this.ipfs.add(rawData)
    return [{symKeyIpfs, rawDataIpfs}]
  }
  /**
   * get all escrows to transact this feed (from graph)
   * @returns {Promise} array of {ipfsKeyHash,ipfsEncryptedData}
   * */
  async getEscrows(){
//TODO
  }

  async offerSell(){
//TODO
  }

  async offerBuy(){
//TODO
  }

}

module.exports = { Feed };
