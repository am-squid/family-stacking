/* eslint-disable react-hooks/exhaustive-deps */
// == Import
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Web3 from 'web3';
import { useEth } from '../../contexts/EthContext';
import findContract from '../../selectors/findContract';
import { Header, Card, Button, Form } from 'semantic-ui-react';
import './staking.scss';

// == Composant
function Staking() {
  const dispatch = useDispatch();
  const { token } = useParams();
  const tokens = useSelector((state) => state.tokens);
  const inputValue = useSelector((state) => state.stakeInputValue);
  const tokenToDisplay = tokens.find((item) => item.symbol === token);
  const { state: { accounts, artifact, contract, networkID } } = useEth();

  const handleChange = (evt) => {
    dispatch({ type: 'CHANGE_STAKING_VALUE', value: evt.target.value });
  };

  const handleStake = async () => {
    let TokenContract;
    let TokenStakingContract;
    let DAIContract;
    let FAMContract;
    let DAIStakeContract;
    let ETHStakeContract;
    let FAMStakeContract;

    // On recup les instances des contracts à utiliser
    if (token === "DAI") {
      TokenContract = findContract(artifact, contract, networkID, "DAI");
      TokenStakingContract = findContract(artifact, contract, networkID, "DAIStake");
    } else if (token === "ETH") {
      TokenStakingContract = findContract(artifact, contract, networkID, "ETHStake");
    } else if (token === "FAM") {
      TokenContract = findContract(artifact, contract, networkID, "FAM");
      TokenStakingContract = findContract(artifact, contract, networkID, "FAMStake");
    }
    
    //! La gestion de l'allowance n'est pas applicable si on send de l'ETH
    if (token !== "ETH") {
      // On recup l'allowance du contract de staking sur les tokens de l'account
      const allowance = await TokenContract.methods.allowance(accounts[0], TokenStakingContract.options.address).call({ from: accounts[0] });

      // Si l'allowance n'est pas suffisante
      if (allowance < parseInt(inputValue)) {

        // On définit la valeur de l'allowance avec la valeur que veut stake l'utilisateur
        await TokenContract.methods.approve(TokenStakingContract.options.address, parseInt(inputValue)).send({ from: accounts[0] });
        
        // On stake
        const receipt = await TokenStakingContract.methods.deposit( parseInt(inputValue)).send({ from: accounts[0] });

        // On recup l'event
        const returnedValues = receipt.events.DepositRegistered.returnValues;
        // On le clean
        const cleanedDepositEvent = {
            userAddress: returnedValues.userAddress,
            amount: returnedValues.amount,
        }
        // Et on le mémorise dans le store
        dispatch({ type: 'DEPOSIT_EVENT', event: cleanedDepositEvent });

        // Un p'tit message pour notifier l'utilisateur
        alert(`Vous avez bien staké ${returnedValues.amount} ${token}`);

      } else {

        // Si l'allowance est suffisante on stake directement
        const receipt = await TokenStakingContract.methods.deposit( parseInt(inputValue)).send({ from: accounts[0] });

        // On recup l'event
        const returnedValues = receipt.events.DepositRegistered.returnValues;
        // On le clean
        const cleanedDepositEvent = {
            userAddress: returnedValues.userAddress,
            amount: returnedValues.amount,
        }
        // Et on le mémorise dans le store
        dispatch({ type: 'DEPOSIT_EVENT', event: cleanedDepositEvent });

        // Un p'tit message pour notifier l'utilisateur
        alert(`Vous avez bien staké ${returnedValues.amount} ${token}`);
      }
    } else {
      const receipt = await TokenStakingContract.methods.deposit().send({ from: accounts[0], value: parseInt(inputValue) });

      // On recup l'event
      const returnedValues = receipt.events.DepositRegistered.returnValues;
      // On le clean
      const cleanedDepositEvent = {
          userAddress: returnedValues.userAddress,
          amount: returnedValues.amount,
      }
      // Et on le mémorise dans le store
      dispatch({ type: 'DEPOSIT_EVENT', event: cleanedDepositEvent });

      // Un p'tit message pour notifier l'utilisateur
      alert(`Vous avez bien staké ${returnedValues.amount} ${token}`);
    }

    // On refresh pour recup les bonnes infos depuis le SM
    // La recup se fait dans le composant Header
    window.location.reload();
  };

  const handleDaiFaucet = async () => {
    const DAIContract = findContract(artifact, contract, networkID, "DAI");
    await DAIContract.methods.faucet(accounts[0], Web3.utils.toBN(5000000000000000000)).send({ from: accounts[0] });
  };

  const handleFamFaucet = async () => {
    const FAMContract = findContract(artifact, contract, networkID, "FAM");
    await FAMContract.methods.faucet(accounts[0], Web3.utils.toBN(5000000000000000000)).send({ from: accounts[0] });
  };

  return (
    <section className="staking">
      <Header as='h1' className="staking-title">
        Stake your <strong>{tokenToDisplay.symbol}</strong>
        <Header.Subheader className="hero-subtitle">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Omnis, fuga.
        </Header.Subheader>
        {token === "DAI" && <Button onClick={handleDaiFaucet}>DAI FAUCET</Button>}
        {token === "FAM" && <Button onClick={handleFamFaucet}>FAM FAUCET</Button>}
        
      </Header>

      <Card className="staking-item" raised centered>
        <Card.Content textAlign="center">

        <Form onSubmit={handleStake}>
          <Form.Field>
            <input placeholder='Amount' value={inputValue} onChange={handleChange} />
          </Form.Field>
          <Card.Description>
            <div className="staking-datas">
              <div className="staking-datas-total-stake">
                <p>Your staked balance</p>
                <p>{tokenToDisplay.stakedBalance} {tokenToDisplay.symbol}</p>
              </div>
              <div className="staking-datas-price">
                <p>Exchange rate</p>
                <p>1 {tokenToDisplay.symbol} = {tokenToDisplay.price} $</p>
              </div>
              <div className="staking-datas-apr">
                <p>Annual percentage rate</p>
                <p>{tokenToDisplay.apr * 100}%</p>
              </div>
              <div className="staking-datas-estimated-rewards">
                <p>Estimated rewards</p>
                <p>{tokenToDisplay.estimatedFAMRewards.toFixed(3)}FAM</p>
              </div>
            </div>
          </Card.Description>
          <Button fluid color='purple' type="submit" className="staking-item-button">
            Stake Now
          </Button>
        </Form>

        </Card.Content>
      </Card>
    </section>
  );
}

// == Export
export default Staking;
