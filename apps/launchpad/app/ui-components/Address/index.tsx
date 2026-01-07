import Identicon from '@polkadot/react-identicon'
import { shortenAddress } from '@/global/utils/shortenAddress'

interface Props {
  address: string
  className?: string
  addressDisplayText?: string
  startChars?: number
  endChars?: number
  iconSize?: number
}

function Address({
  address,
  addressDisplayText,
  className,
  startChars,
  endChars,
  iconSize = 20,
}: Props) {
  return (
    <div className={`${className} flex flex-row items-center gap-1.5`} title={address}>
      <Identicon className='image identicon' value={address} size={iconSize} theme='polkadot' />

      <p className='flex flex-nowrap whitespace-nowrap'>
        {addressDisplayText ||
          (startChars && endChars
            ? shortenAddress({
                text: address,
                startChars,
                endChars,
              })
            : address)}
      </p>
    </div>
  )
}

export default Address
