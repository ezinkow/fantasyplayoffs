import React from 'react'
import Navbar from '../components/Navbar'
import Scoreboard from '../components/Scoreboard'
// import PicksTiebreaker from '../components/PicksTiebreaker'

export default function PicksContainer() {


    return (
        <div>
            <Navbar />
            <div className='=container'>
                <Scoreboard />
            </div>
        </div>
    )
}