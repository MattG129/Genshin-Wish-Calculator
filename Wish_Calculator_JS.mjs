
let Trials = 100000;

let Today = new Date();
Today.setHours(0,0,0,0);

function DateAdd(date, days) {
    const newDate = new Date(date);
    
    newDate.setDate(date.getDate() + days);
    
    return newDate;
}

function PatchAndDateCalculator(WishConfig) {
    // NA region's start date for version 4 in est. Since (almost) all patches are exactly six weeks, we can use this date to derive the start dates for other patches.
    // const v4StartDate = DateTime.fromObject({ year: 2023, month: 8, day: 15 });
    const v4StartDate = moment('2023-8-15', "YYYY-MM-DD").toDate();

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
    let Primos = WishConfig.Primos;


    // TODO: See if there is a better way to do this.
    let DateDiff = Math.floor((WishConfig.WishingEndDate - Today) / (1000* 60 * 60 * 24));

    Primos += DateDiff * (60 + (WishConfig.HasWelkin ? 90 : 0)); // 60 primos for dailies plus 90 for welkin, if purchased.

    let ExpectedAbyssPrimos = 0

    const FloorVals = [WishConfig.ExpectedStarsFloor9, WishConfig.ExpectedStarsFloor10, WishConfig.ExpectedStarsFloor11, WishConfig.ExpectedStarsFloor12]
    
    for (let i = 0; i <= FloorVals.length; i++) {
        if (FloorVals[i] == 9) {
            ExpectedAbyssPrimos += 200;
        }
        else if (FloorVals[i] >= 6) {
            ExpectedAbyssPrimos += 100;
        }
        else if (FloorVals[i] >= 3) {
            ExpectedAbyssPrimos += 50;
        }
    }

    // TODO: Might want to add a comment here explaining the whole process.
    let AbyssCycles = WishConfig.MonthDiff - WishConfig.AbyssCurrentCycleCompleted;
    
    // Since the abyss resets on the 16th of each month, the calculations needed to get the number of abyss cycles, are slightly different.
    if (WishConfig.WishingEndDate.getDate() >= 16) {
        AbyssCycles += 1;
    }
    if (Today.getDate() < 16) {
        AbyssCycles += 1;
    }

    Primos += ExpectedAbyssPrimos * AbyssCycles;

    let ExpectedTheaterPrimos = 0;
    switch (WishConfig.ExpectedAct) {
        case 0:  ExpectedTheaterPrimos = 0;   break;
        case 1:  ExpectedTheaterPrimos = 60;  break;
        case 2:  ExpectedTheaterPrimos = 120; break;
        case 3:  ExpectedTheaterPrimos = 220; break;
        case 4:  ExpectedTheaterPrimos = 280; break;
        case 5:  ExpectedTheaterPrimos = 340; break;
        case 6:  ExpectedTheaterPrimos = 440; break;
        case 7:  ExpectedTheaterPrimos = 500; break;
        case 8:  ExpectedTheaterPrimos = 620; break;
        case 9:  ExpectedTheaterPrimos = 680; break;
        case 10: ExpectedTheaterPrimos = 800; break;
    }

    // Expected Primos times the number of months left to save plus the current month, if the challenge hasn't already been completed this month.
    Primos += ExpectedTheaterPrimos * (WishConfig.MonthDiff + (1 - WishConfig.ITCurrentCycleCompleted));

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
    let IntertwinedFates = WishConfig.IntertwinedFates;

    // Up to five Intertwined Fates can be purchased every month from the Stardust Exchange.
    // Assumes that the current month's supply has already been purchased.
    // If the Stardust field is left empty then it will be assumed that all available Intertwined Fates can be purchased.
    if (WishConfig.Stardust === '') {
        IntertwinedFates += 5 * WishConfig.MonthDiff;
    }
    else {
        IntertwinedFates += Math.min(5 * WishConfig.MonthDiff, Math.floor(WishConfig.Stardust / 75));
    }

    // TODO: Could maybe go a bit more in depth.
    let Starglitter;
    if (WishConfig.UsingStarglitter) {
        IntertwinedFates += Math.floor(WishConfig.Starglitter / 5);
        Starglitter = WishConfig.Starglitter % 5;
    }

    // TODO: Could maybe go a bit more in depth.
    if (WishConfig.BPPurchased) {
        IntertwinedFates += Math.max(0, (WishConfig.EndPhase === 1 ? 3 : 4) + 4 * WishConfig.PatchDiff - Math.min(4, Math.floor(WishConfig.BPLevel / 10))); 
        // Assumes that the user will only be able to claim 3 of the 4 fates for that pass, if the banner ends in the first phase. 
        // Also, subtracts the amount of fates already claimed from this battle pass.
        // Subtracting the claimed interwined fates has to be done on the same line so it can be wrapped in the max function as there is an edge case where
        //      the user can earn 4 intertwined from the pass while the system is only expecting 3 to be claimable and so it would result in -1 fates being expected from the pass.

        Primos += 680 * ((WishConfig.EndPhase === 2 ? 1 : 0) + WishConfig.PatchDiff); // Assumes that the user won't reach level 50 for that pass, if the banner ends in the first phase.
        if (WishConfig.BPLevel === 50) { // Subtracts 680, if the primos have already been claimed for this pass.
            Primos -= 680;
        }
    }

    // TODO: Could maybe go a bit more in depth.
    let WishesMade = Math.floor(Primos/160) + IntertwinedFates;

    // TODO: Could maybe go a bit more in depth.
    if (WishConfig.UsingStarglitter) {
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

function NumericWishCalculations(WishConfig, MaxWishes) {
    // TODO: Add comments.

    let Successes = 0;
    let DynamicMaxWishes;
    let Lost5050s;
    for (let TrialCount = 0; TrialCount < Trials; TrialCount++) {
        Lost5050s = 0
        DynamicMaxWishes = MaxWishes
        let Wishes = 0;

        let Pity = WishConfig.CharacterPity;
        let Guarantee = WishConfig.CharacterGuarantee;
        let Characters = 0;
        let p = 0.006;

        while (Characters < WishConfig.CharacterGoal && Wishes < DynamicMaxWishes) {
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
                    Lost5050s++;

                    if ( WishConfig.UsingStarglitter && (WishConfig.MissingFiveStars - Lost5050s <= 0) ){
                        DynamicMaxWishes += 2
                    }
                }
            }
        }

        Pity = WishConfig.WeaponPity;
        Guarantee = WishConfig.WeaponGuarantee;
        let FatePoints = WishConfig.FatePoints;
        let Weapons = 0;
        p = 0.007;

        while (Weapons < WishConfig.WeaponGoal && Wishes < DynamicMaxWishes) {
            Wishes++;
            Pity++;

            if (Pity >= 63) {
                p += 0.07;
            }

            if (Math.random() <= p) {
                p = 0.007;
                Pity = 0;
                
                if (WishConfig.UsingStarglitter) {
                    DynamicMaxWishes += 2
                }

                let r = Math.random();

                if (FatePoints === 1 || (Guarantee && r <= 0.5) || (r <= 0.375)) {
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

        if (Characters >= WishConfig.CharacterGoal && Weapons >= WishConfig.WeaponGoal) {
            Successes++;
        }
    }

    // TODO: See if there is a built in function for this.
    return ((Successes / Trials)*100).toFixed(2);
}

// Stub function. Will use this in the future for wish simulations.
function GetWishNumberDistributions() {
    let MaxPity = 90;

    let states = {};
    let FiveStarChance;

    for (let i = 0; i <= MaxPity; i++) {
        states[i] = {};

        // This needs to be updated for weapon and chronicled banners.
        FiveStarChance = Math.min(.006 + .06*Math.max(0, i-72), 1);

        if (i < MaxPity) {
            states[i][i+1] = 1-FiveStarChance;
        }
        
        states[i][90] = FiveStarChance;
    }

    let stateTransformations = [];
    let rowTransformations;

    for (const [key, value] of Object.entries(states)) {
        rowTransformations = new Array(Object.keys(states).length).fill(0);

        for (const [SubKey, SubValue] of Object.entries(value)) {
            rowTransformations[SubKey] = SubValue
        };

        stateTransformations.push(rowTransformations);
    };

    let stateTransformationsMatrix = math.matrix(stateTransformations.slice(), 'sparse')
    const OriginalStateTransformationsMatrix = math.matrix(stateTransformations.slice(), 'sparse')

    let Pities = Array.from(Array(MaxPity), () => [0]);

    for (let i = 1; i < MaxPity; i++) {
        for (let CharacterPity = 0; CharacterPity <= MaxPity-i; CharacterPity++) {
            Pities[CharacterPity].push(math.subset(stateTransformationsMatrix, math.index(CharacterPity, Object.keys(states).length-1)).toFixed(6));
        }
        
        stateTransformationsMatrix = math.multiply(stateTransformationsMatrix, OriginalStateTransformationsMatrix)
    }

    console.dir(Pities, {'maxArrayLength': null})
}

function WishCalcs(WishConfig) {

    Object.assign(WishConfig, PatchAndDateCalculator(WishConfig));

    $('#WishEndDate').show().html(`Wishing End Date: ${moment(WishConfig.WishingEndDate, "YYYY-MM-DD").format('L')}`);

    $('#BannerEnded').hide();
    if (WishConfig.WishingEndDate < Today) {
        $('#BannerEnded').show().html('Banner has already ended.');
        $('#MaxWishes,#WishingGoals,#Chance').hide();
        return ''
    }

    const MaxWishes = SavingsCalculator(WishConfig);

    $('#MaxWishes').show().html(`Max Number of Wishes: ${MaxWishes}`);

    let WishingFor = 'Wishing for ';

    if (WishConfig.CharacterGoal > 1) {
        WishingFor += `${WishConfig.CharacterGoal} characters`
    }
    else if (WishConfig.CharacterGoal > 0) {
        WishingFor += `${WishConfig.CharacterGoal} character`
    }

    if (WishConfig.CharacterGoal > 0 && WishConfig.WeaponGoal > 0) {
        WishingFor += ' and '
    }
    else if (WishConfig.WeaponGoal == 0){
        WishingFor += '.'
    }

    if (WishConfig.WeaponGoal > 1) {
        WishingFor += `${WishConfig.WeaponGoal} weapons.`
    }
    else if (WishConfig.WeaponGoal > 0) {
        WishingFor += `${WishConfig.WeaponGoal} weapon.`
    }

    $('#WishingGoals').show().html(WishingFor);
    
    if (WishConfig.CharacterGoal + WishConfig.WeaponGoal > 0) {
        $('#Chance').show().html(`Chances of reaching wish goals: ${NumericWishCalculations(WishConfig, MaxWishes)}%`);
    }
}