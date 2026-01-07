'use client'

import { useState } from 'react'
import Image from 'next/image'
import Modal from '../Modal'
import SecondaryButton from '../SecondaryButton'

const Footer = () => {
  const [openModal, setOpenModal] = useState<boolean>(false)

  return (
    <div className='flex h-full w-full items-center justify-between p-1 sm:p-2'>
      <Modal
        onCancel={() => setOpenModal(false)}
        title={<div>How it Works</div>}
        open={openModal}
        footer={null}
      >
        <div className='flex flex-col gap-y-3 text-white'>
          <p className='mb-2'>
            Only.fun prevents rugs by making sure that all created tokens are safe. Each coin on
            only.fun is a fair-launch with no presale and no team allocation.
          </p>
          <p>step 1: pick a coin that you like</p>
          <p>step 2: buy the coin</p>
          <p>step 3: sell at any time to lock in your profits or losses</p>
          <p>step 4: when enough people buy on the curve it reaches a market cap of $60k</p>
          <p>step 5: $12k of liquidity is then deposited in HydraDX and all lp tokens burned</p>
        </div>
      </Modal>
      <div className='flex items-center gap-x-4'>
        <a href='https://x.com/onlydotfun_' target='_blank' rel='noreferrer'>
          <Image src='/assets/twitter.png' alt='twitter' width={24} height={24} />
        </a>
        <a href='https://t.me/+8W0V-loQ6K8wN2E1' target='_blank' rel='noreferrer'>
          <Image src='/assets/telegram.png' alt='telegram' width={24} height={24} />
        </a>
      </div>
      <div className='flex items-center gap-x-2'>
        <SecondaryButton onClick={() => setOpenModal(true)}>How it Works</SecondaryButton>
        <a href='https://t.me/+8W0V-loQ6K8wN2E1' target='_blank' rel='noreferrer'>
          <SecondaryButton onClick={() => {}}>Support</SecondaryButton>
        </a>
      </div>
    </div>
  )
}

export default Footer
