const etherlime = require("etherlime-lib");
const { deploy } = require("../deploy_ganache");
const { ethers } = require("ethers");
const ganache = require("ganache-core");
const assert = require("assert");
const {Contracts} = require("../../packages/Base")
const {
    hexlify,
    NULL_ADDRESS,
    wallet,
    operatorWallet,
    provider,
    stakerWallet,
    counterpartyWallet
} = require("../utils");
const {
    ErasureClient
} = require("../../packages/ErasureClient");
const {RATIO_TYPES,AGREEMENT_TYPE} = require("../../packages/Utils")

describe("ErasureClient", function() {
    const staker = stakerWallet.address,
        counterparty = counterpartyWallet.address,
        network = "ganache",
        ratio = 2,
        ratioType = RATIO_TYPES.Dec,
        metaData = "metaData",
        proof="proof"
    let client, ipfs,graph

    describe("Erasure Client test", function() {
        before(async () => {
        });
        it("Should create with no wallet and provider specified", ()=>{
          client = new ErasureClient()
        })
        it("1.Should create a Erasure Client", async () => {
            client = new ErasureClient({wallet,provider,network})
        });
        it("2.Should get registry infomation", async () => {
            const usersCount = await client.getUsersCount()
            const users = await client.getAllUsers()
            const feedsCount = await client.getFeedsCount()
            assert.equal(feedsCount,0)
            const agreementsCount = await client.getAgreementsCount()
            assert.equal(agreementsCount,'1')
            assert.equal(usersCount,0)
        });
        it("3.Should create and get Feed", async () => {
            const {confirmedTx,feed} = await client.createFeed({proof,metaData})
            assert(feed.address,"no feed created")
            const feedsCount = await client.getFeedsCount()
            assert.equal(feedsCount,1,"There should be 1 feed in registry")
            const sameFeed = await client.getFeed(feed.address)
            const owner = await feed.owner()
            assert.equal(owner,wallet.address)
        });

        it("4. Should create and get Agreement", async () => {
            const agreementOpts={
                staker,
                counterparty,
                metaData,
                ratio,
                ratioType
            }
            console.log("agreement opts:", agreementOpts)
            const {confirmedTx,agreement} = await client.createAgreement(agreementOpts)
            assert(agreement.address,"No agreement created")
            const agreementCount = await client.getAgreementsCount()
            assert.equal(agreementCount,1,"should have 1 agreement in registry")
            const sameAgreement = await client.getAgreement(agreement.address)
            assert.equal(sameAgreement.address,agreement.address)
        });
        it("5 . Should create and get escrow",async ()=>{
            const escrowOpts ={
                paymentAmount:1,
                stakeAmount:1,
                countdown:1,
                agreementParams:{
                    ratio,
                    ratioType,
                    agreementCountdown:20
                },
                buyer:wallet.address,
                metaData


            }
            const {confirmedTx,escrow} = await client.createEscrow(escrowOpts)
            assert(escrow.address,"No escrow created")
            const escrowCount = await client.getEscrowsCount()
            assert.equal(escrowCount,1)
            const sameEscrow = await client.getEscrow(escrow.address)
            assert.equal(sameEscrow.address,escrow.address)
        });

    });
});
