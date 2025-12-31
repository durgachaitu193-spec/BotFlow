'use client'
import { Select } from 'antd'
import { useApiContext } from '@/context'
import { networkConstants } from '@/global/networkConstants'

function SelectNetwork() {
  const { network, apiReady, setNetwork } = useApiContext()
  const networks = Object.keys(networkConstants)
  return (
    <div className='flex flex-col items-center justify-center'>
      {apiReady ? <div>Connected Network: {network}</div> : <div>loading...</div>}
      <Select onChange={(value) => setNetwork(value)} value={network}>
        {networks.map((network) => (
          <Select.Option value={network} key={network}>
            {network}
          </Select.Option>
        ))}
      </Select>
    </div>
  )
}

export default SelectNetwork
