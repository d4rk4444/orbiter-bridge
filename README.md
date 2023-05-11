# orbiter-bridge
Script for Orbiter.Finance bridge automation.   
**Before launching, see if the bridge path works on the site**

## Setup    
``` 
git clone https://github.com/d4rk4444/orbiter-bridge.git
cd orbiter-bridge
npm i
``` 

## Configuration       
All the settings you need are in the .env file      

1. Infura API key   
2. Pause between wallets in sec.    
3. Procent for bridge in %    

In the private.txt file insert private addresses in this format:     
```
key1
key2
```

In the file addressStarknet.txt insert Starknet addresses for ETH deposit:      
```
address1
address2
```
    
## Launch
```
node index
```