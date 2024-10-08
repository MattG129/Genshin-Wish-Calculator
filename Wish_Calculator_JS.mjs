// TODO: Some of these comments should be added to the webpage.
// TODO: Should add validations to the wish config.
// TODO: Add something to remark if parameters might be out of date with those used for the on screen calculations.
// TODO: Add starglitter for five stars.
// TODO: Add import/export.
// TODO: See about adding batch wishing functionality. Soft pity might prevent it from being worthwhile.
// TODO: Add a mode to allow direct input of primos and intertwined as some users may just want a simpler calculator.
// TODO: Try to make this analytic instead of numeric.

let NumberOfTrials = 1000000;

let Today = new Date();
Today.setHours(0,0,0,0);

const WishConfig = {
    Matthew: {
        CurrentPrimos: 0,
        CurrentIntertwinedFates: 0,
        Stardust: 0,
        
        UsingStarglitterForWishes: false,
        Starglitter: 0,
        MissingFourStars: 1,
        
        // TODO: This should take in the expected number of stars per floor and calculate the expected number of primos based on that, rather than having the user run the numbers.
        Abyss: {
            Unlocked: false,
            ExpectedPrimos: 800,
            CurrentCycleCompleted: true
        },

        // TODO: This should take in the expected number of acts completed and calculate the expected number of primos based on that, rather than having the user run the numbers.
        ImaginariumTheater: {
            Unlocked: false,
            ExpectedPrimos: 620,
            CurrentCycleCompleted: true
        },
        
        BattlePass: {
            Purchased: false,
            Level: 19
            // Since wish related rewards are only given every ten levels you only need to make sure the tens-place digit is correct. 
            // For example, 40 and 45 are effectively the same while 40 and 50 are not.
        },

        HasWelkin: false,

        // The patch and phase that you need to make your wishes by.
        EndPatch: 4.8,
        EndPhase: 1,

        // CharacterPity: 12,
        CharacterPity: 0,
        CharacterGuarantee: 0,

        WeaponPity: 42,
        WeaponGuarantee: 0,
        FatePoints: 0,

        CharacterGoal: [
            'Shenhe',
            'Kinich',
            'Capitano',
        ],

        WeaponGoal: [
            // 'Cashflow Supervision',
            // 'Staff of Homa'
        ],
    }
};

function DateAdd(date, days) {
    const newDate = new Date(date);
    
    newDate.setDate(date.getDate() + days);
    
    return newDate;
}

function PatchAndDateCalculator(WishConfig) {
    // NA region's start date for version 4 in est. Since (almost) all patches are exactly six weeks, we can use this date to derive the start dates for other patches.
    // const v4StartDate = DateTime.fromObject({ year: 2023, month: 8, day: 15 });
    const v4StartDate = new Date('2023-8-15');

    // The number of patches between 4.0 and the final patch for wishing.
    let BasePatchDiffAsDecimal = (WishConfig.EndPatch - 4.0).toFixed(1);

    // Assumes 9 patches per version.
    //TODO: Add a comment for this.
    let BasePatchDiff = Math.floor(9 * Math.floor(BasePatchDiffAsDecimal) + 10 * (BasePatchDiffAsDecimal % 1));

    //TODO: Add a comment for this.
    let BasePhaseDiff = Math.floor(2 * BasePatchDiff + WishConfig.EndPhase);

    //TODO: Add a comment for this.
    let WishingEndDate = DateAdd(v4StartDate, 21*BasePhaseDiff);

    // Adds up the number of start dates for new patches, that are after the current date but before the end date, to get the number of patches between now and then.
    // TODO: I think a comment adding more context could be useful here as well or maybe even a comment explaining the functions process as a hole.
    let PatchDiff = 0;
    let PatchDate = v4StartDate;
    for (let i = 0; i <= BasePatchDiff; i++) {
        PatchDate = DateAdd(PatchDate, 42);
        if (Today < PatchDate && PatchDate < WishingEndDate) {
            PatchDiff += 1;
        }
    }

    return {
        WishingEndDate: WishingEndDate,
        PatchDiff: PatchDiff,
        // TODO: See if there is a better way to do this.
        MonthDiff: 12 * (WishingEndDate.getFullYear() - Today.getFullYear()) + (WishingEndDate.getMonth() - Today.getMonth()),
        // TODO: See if there is a better way to do this.
        DaysSincePatchStarted: Math.floor((Today - v4StartDate) / (1000* 60 * 60 * 24)) % 42
    };
}

function SavingsCalculator(WishConfig) {

    // TODO: Could maybe go a bit more in depth.
    let Primos = WishConfig.CurrentPrimos;

    // TODO: See if there is a better way to do this.
    var DateDiff = Math.floor((WishConfig.WishingEndDate - Today) / (1000* 60 * 60 * 24));

    Primos += DateDiff * (60 + (WishConfig.HasWelkin ? 90 : 0)); // 60 primos for dailies plus 90 for welkin, if purchased.
    
    if (WishConfig.Abyss.Unlocked) {
        // TODO: Might want to add a comment here explaining the whole process.
        let AbyssCycles = WishConfig.MonthDiff - WishConfig.Abyss.CurrentCycleCompleted;
        
        // Since the abyss resets on the 16th of each month, the calculations needed to get the number of abyss cycles, are slightly different.
        if (WishConfig.WishingEndDate.getDate() >= 16) {
            AbyssCycles += 1;
        }
        if (Today.getDate() < 16) {
            AbyssCycles += 1;
        }

        Primos += WishConfig.Abyss.ExpectedPrimos * AbyssCycles;
    }

    if (WishConfig.ImaginariumTheater.Unlocked) {
        // Expected Primos times the number of months left to save plus the current month, if the challenge hasn't already been completed this month.
        Primos += WishConfig.ImaginariumTheater.ExpectedPrimos * (WishConfig.MonthDiff + (1 - WishConfig.ImaginariumTheater.CurrentCycleCompleted));
    }

    // Live Stream Primos
    // TODO: Could maybe go a bit more in depth.
    Primos += 300 * (WishConfig.PatchDiff);

    // Adding in the current patches primos for the live steam, if applicable. Live streams generally air on the second to last Friday of a patch, or the 31 days into the patch. 
    // If we are 31 or more days into the patch, then the user should have already been able to claim the primos, thus we no longer need to account for them. 
    // If the current patch is also the final patch, for wishing, then wishing will have to go into the second phase in order to claim the primos.
    if ((WishConfig.PatchDiff > 0 || WishConfig.EndPhase === 2) && (WishConfig.DaysSincePatchStarted < 31)) {
        Primos += 300;
    }

    // Maintenance
    // TODO: Could maybe go a bit more in depth.
    Primos += 300 * WishConfig.PatchDiff;

    // TODO: Could maybe go a bit more in depth.
    let IntertwinedFates = WishConfig.CurrentIntertwinedFates;

    // Up to five Intertwined Fates can be purchased every month from the Stardust Exchange.
    // Assumes that the current month's supply has already been purchased.
    IntertwinedFates += Math.min(5 * WishConfig.MonthDiff, Math.floor(WishConfig.Stardust / 75));

    // TODO: Could maybe go a bit more in depth.
    if (WishConfig.UsingStarglitterForWishes) {
        IntertwinedFates += Math.floor(WishConfig.Starglitter / 5);
        Starglitter = WishConfig.Starglitter % 5;
    }

    // TODO: Could maybe go a bit more in depth.
    if (WishConfig.BattlePass.Purchased) {
        IntertwinedFates += (WishConfig.EndPhase === 1 ? 3 : 4) + 4 * WishConfig.PatchDiff; // Assumes that the user will only be able to claim 3 of the 4 fates for that pass, if the banner ends in the first phase.
        IntertwinedFates -= Math.min(4, Math.floor(WishConfig.BattlePass.Level / 10)); // Subtracts the amount of fates already claimed from this battle pass.

        Primos += 680 * ((WishConfig.EndPhase === 2 ? 1 : 0) + WishConfig.PatchDiff); // Assumes that the user won't reach level 50 for that pass, if the banner ends in the first phase.
        if (WishConfig.BattlePass.Level === 50) { // Subtracts 680, if the primos have already been claimed for this pass.
            Primos -= 680;
        }
    }

    // TODO: Could maybe go a bit more in depth.
    let WishesMade = Math.floor(Primos/160) + IntertwinedFates;

    // TODO: Could maybe go a bit more in depth.
    if (WishConfig.UsingStarglitterForWishes) {
        let FourStars = Math.floor(WishesMade / 10);
        let FourStarPity = WishesMade % 10;
        // TODO: Add a comment regarding why this doesn't differentiate for on banner and off banner four stars.
        Starglitter += Math.max(0, 2 * (FourStars - (WishConfig.MissingFourStars + WishConfig.PatchDiff)));
        // Won't get starglitter for newly acquired four stars. Adds up the number of currently missing four stars plus those that may be added in future patches. 
        // Assumes that one will be added per patch to err on the side of caution, although this often won't be the case.

        let AdditionalWishesMade;
        let AdditionalFourStars;
        while (Starglitter >= 5) {
            AdditionalWishesMade = Math.floor(Starglitter / 5);
            Starglitter %= 5;
            AdditionalFourStars = Math.floor((AdditionalWishesMade + FourStarPity) / 10);
            FourStarPity = (AdditionalWishesMade + FourStarPity) % 10;
            Starglitter += 2 * AdditionalFourStars;

            WishesMade += AdditionalWishesMade;
        }
    }

    return WishesMade
}

function NumericWishCalculations(WishConfig, MaxNumberOfWishes) {
    // TODO: Add comments.

    const CharacterGoalCount = WishConfig.CharacterGoal.length;
    const WeaponGoalCount = WishConfig.WeaponGoal.length;

    let Successes = 0;
    for (let i = 0; i < NumberOfTrials; i++) {
        let Wishes = 0;

        let Pity = WishConfig.CharacterPity;
        let Guarantee = WishConfig.CharacterGuarantee;
        let Characters = 0;
        let p = 0.006;

        while (Characters < CharacterGoalCount && Wishes < MaxNumberOfWishes) {
            Wishes++;
            Pity++;

            if (Pity >= 74) {
                p += 0.06;
            }

            if (Math.random() <= p) {
                p = 0.006;
                Pity = 0;

                if (Guarantee || (Math.random() < 0.5)) {
                    Characters++;
                    Guarantee = 0;
                } else {
                    Guarantee = 1;
                }
            }
        }

        Pity = WishConfig.WeaponPity;
        Guarantee = WishConfig.WeaponGuarantee;
        let FatePoints = WishConfig.FatePoints;
        let Weapons = 0;
        p = 0.007;

        while (Weapons < WeaponGoalCount && Wishes < MaxNumberOfWishes) {
            Wishes++;
            Pity++;

            if (Pity >= 63) {
                p += 0.07;
            }

            if (Math.random() <= p) {
                p = 0.007;
                Pity = 0;
                // TODO: What is r?
                let r = Math.random();

                if (FatePoints === 2 || (Guarantee && r <= 0.5) || (r <= 0.375)) {
                    Weapons++;
                    Guarantee = 0;
                    FatePoints = 0;
                } else if (Guarantee || (r <= 0.75)) {
                    Guarantee = 0;
                    FatePoints++;
                } else {
                    Guarantee = 1;
                    FatePoints++;
                }
            }
        }

        if (Characters >= CharacterGoalCount && Weapons >= WeaponGoalCount) {
            Successes++;
        }
    }

    // See if there is a built in function for this.
    return ((Successes / NumberOfTrials)*100).toFixed(2);
}


import * as math from 'mathjs'


function AnalyticWishCalculations(WishConfig, MaxNumberOfWishes) {
    // TODO: Add comments.

    const CharacterGoalCount = WishConfig.CharacterGoal.length;
    const WeaponGoalCount = WishConfig.WeaponGoal.length;

    let Successes = 0;
    var states = {};
    let Key;
    let state = {}
    let Next1 = {};
    let Next2 = {};
    let FiveStarChance;
    let Finished = 0;
    let transitions;
    var NextChar;
    for (let i = 0; i < 180*WishConfig.CharacterGoal.length; i++) {
        transitions = {}
        transitions['ID'] = i

        // console.log((Math.floor(i/180) + 1), WishConfig.CharacterGoal.length - 1);

        if ( (Math.floor(i/180) + 1) < WishConfig.CharacterGoal.length) {
            NextChar = WishConfig.CharacterGoal[Math.floor(i/180)+1]
        } 
        else{
            NextChar = 'Finished'
        }

        // console.log(NextChar);

        if (i >= 180*WishConfig.CharacterGoal.length - 1) {
            // Finished = 1
            transitions['Finished-0-0'] = 1
        } else {
            FiveStarChance = Math.min(.006 + .06*Math.max(0, (i % 90) - 72), 1)

            transitions[`${WishConfig.CharacterGoal[Math.floor(i/180)]}-${ (i+1)%90 }-${Math.floor( ((i+1)/90) % 2 )}`] = (1-FiveStarChance)
            if (i % 180 < 90) {
                transitions[`${WishConfig.CharacterGoal[Math.floor(i/180)]}-0-1`] = (FiveStarChance/2)
                transitions[`${NextChar}-0-0`] = (FiveStarChance/2)
            } else {
                transitions[`${NextChar}-0-0`] = FiveStarChance;
            }
        }

        Key = `${WishConfig.CharacterGoal[Math.floor(i/180)]}-${i % 90}-${Math.floor( ((i)/90) % 2 )}`
        states[Key] =  transitions
    }

    Key = `${WishConfig.CharacterGoal[Math.floor(i/180)]}-${i % 90}-${Math.floor( ((i+1)/90) % 2 )}`
    states['Finished-0-0'] =  {'ID': 540, 'Finished-0-0': 1}

    console.log('States Generated');

    // console.log(states);

    let stateTransformations = [];
    let rowTransformations;
    let TransationProbability;
    let iterKey;
    var Char;


    for (const [key, value] of Object.entries(states)) {
        // rowTransformations = [];
        rowTransformations = new Array(len).fill(0);;
        for (var i = 0; i < Object.keys(states).length; i++) {    
            if ( Math.floor(i/180) < WishConfig.CharacterGoal.length  ) {
                Char = WishConfig.CharacterGoal[Math.floor(i/180)]
            } 
            else{
                Char = 'Finished'
            }

            iterKey = `${Char}-${i % 90}-${Math.floor( (i/90) % 2)}`
            if (iterKey in value) {
                TransationProbability = value[iterKey]
            } else {
                TransationProbability = 0
            }
            rowTransformations.push(TransationProbability);
         }
         stateTransformations.push(rowTransformations)
    };

    console.log('Transition Matrix Generated')

    // console.log(stateTransformations)

    var stateTransformationsMatrix = math.matrix(stateTransformations)

    var stateTransformationsMatrixPowers = {};
    stateTransformationsMatrixPowers['0'] = stateTransformationsMatrix;
    

    let MaxNumberOfWishesBin = (MaxNumberOfWishes >>> 0).toString(2);
    let ReverseMaxNumberOfWishesBin = MaxNumberOfWishesBin.split('').reverse().join('');
    
    console.log(`Matrix Power: 1`);
    for (var i = 1; i < MaxNumberOfWishesBin.length; i++) {
        console.log(`Matrix Power: ${Math.pow(2, i)}`);
        stateTransformationsMatrixPowers[`${i}`] = math.multiply(stateTransformationsMatrixPowers[`${i-1}`], stateTransformationsMatrixPowers[`${i-1}`])
    }

    let FinalStateTransformationMatrix = math.identity(Object.keys(states).length);
    for (var i = 0; i < MaxNumberOfWishesBin.length ; i++) {
        if(ReverseMaxNumberOfWishesBin[i] == '1') {
            FinalStateTransformationMatrix = math.multiply(FinalStateTransformationMatrix, stateTransformationsMatrixPowers[`${i}`])
        }
    };

     console.log(`${(math.subset(FinalStateTransformationMatrix, math.index(WishConfig.CharacterPity, Object.keys(states).length-1))*100).toFixed(2)}%`)
     // console.log(FinalStateTransformationMatrix)

}

function WishCalcs(WishConfig) {
    Object.assign(WishConfig, PatchAndDateCalculator(WishConfig));

    // TODO: See if we can add back in a leading zero for single digit numbers.
    console.log(`Wishing End Date: ${WishConfig.WishingEndDate.toLocaleDateString("en-US")}\n`);

    if (WishConfig.WishingEndDate < Today) {
        console.log("Banner has already ended.\n");
        return '';
    }

    // const MaxNumberOfWishes = SavingsCalculator(WishConfig);
    const MaxNumberOfWishes = 120;

    WishConfig.CharacterPity = 42+90;

    if (typeof MaxNumberOfWishes !== 'number') {
        return;
    }

    console.log(`Max Number of Wishes: ${MaxNumberOfWishes}\n`);

    if (WishConfig.CharacterGoal.length > 0) {
        console.log(`Character Goals: ${WishConfig.CharacterGoal.join(", ")}\n`);
    }

    if (WishConfig.WeaponGoal.length > 0) {
        console.log(`Weapon Goals: ${WishConfig.WeaponGoal.join(", ")}\n`);
    }

    if (WishConfig.CharacterGoal.length + WishConfig.WeaponGoal.length > 0) {
        console.log(`Chances of reaching wish goals: ${NumericWishCalculations(WishConfig, MaxNumberOfWishes)}%\n`);
    }

    AnalyticWishCalculations(WishConfig, MaxNumberOfWishes)

    // return 'Banana'
}

WishCalcs(WishConfig.Matthew);