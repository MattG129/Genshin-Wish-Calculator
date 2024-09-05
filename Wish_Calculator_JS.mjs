// High Priority:
    // Add tool tips for most, if not all, fields.
    // IT acts now go up to 10.
    // Make a notification for if no characters/weapons were chosen.
    // Should add validations to the wish config.
    // Replace the end patch and end phase input with a dropdown that list off each patch/phase and the end date. EX: 5.3 Phase 1 (Ends on 01/01/2025)
    // Add tool tips about features that are coming soon. (Especially capturing radiance.)
    // About section or something giving a general overview of how the calculator works.
    // Field ranges. Both for parsley and the increase/descrease functionality.
    // If a field is skipped then validations shouldn't be checked.
    // Add a mode to allow direct input of primos and intertwined as some users may just want a simpler calculator.
    // Make the site look better.
    // Import/Export descriptions.
    // Improve the wish result display.

// Wish List:
    // Make it so user's can insert the names of what they want instead of just numbers. This should not replace the number fields but should just serve as another method to input wish goals.
    // Add sortable for all selected options.
    // Implement a form of batch wishing that instead of calculating how many five starts were obtained in N wishes, gets the probability distrubution of getting a five star in exactly N wishes, from zero to pity, and have the algorithm use that to get the number of wishes used.
    // Try to make this analytic instead of numeric.
    // Add a chronicled wish section.
    // Capturing Radiance still needs to be implemented but we aren't sure what the actual mechanics of it are.
    // See if we can add back in a leading zero for single digit numbers for dates.

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
    let Primos = WishConfig.Primos;


    // TODO: See if there is a better way to do this.
    var DateDiff = Math.floor((WishConfig.WishingEndDate - Today) / (1000* 60 * 60 * 24));

    Primos += DateDiff * (60 + (WishConfig.HasWelkin ? 90 : 0)); // 60 primos for dailies plus 90 for welkin, if purchased.

    var ExpectedAbyssPrimos = 0

    const FloorVals = [WishConfig.ExpectedStarsFloor9, WishConfig.ExpectedStarsFloor10, WishConfig.ExpectedStarsFloor11, WishConfig.ExpectedStarsFloor12]
    
    for (var i = 0; i <= FloorVals.length; i++) {
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

    switch (WishConfig.ExpectedAct) {
        case 0: var ExpectedTheaterPrimos = 0;
        case 1: var ExpectedTheaterPrimos = 60;
        case 2: var ExpectedTheaterPrimos = 120;
        case 3: var ExpectedTheaterPrimos = 220;
        case 4: var ExpectedTheaterPrimos = 280;
        case 5: var ExpectedTheaterPrimos = 340;
        case 6: var ExpectedTheaterPrimos = 440;
        case 7: var ExpectedTheaterPrimos = 500;
        case 8: var ExpectedTheaterPrimos = 620;
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
    IntertwinedFates += Math.min(5 * WishConfig.MonthDiff, Math.floor(WishConfig.Stardust / 75));

    // TODO: Could maybe go a bit more in depth.
    if (WishConfig.UsingStarglitter) {
        IntertwinedFates += Math.floor(WishConfig.Starglitter / 5);
        var Starglitter = WishConfig.Starglitter % 5;
    }

    // TODO: Could maybe go a bit more in depth.
    if (WishConfig.BPPurchased) {
        IntertwinedFates += (WishConfig.EndPhase === 1 ? 3 : 4) + 4 * WishConfig.PatchDiff; // Assumes that the user will only be able to claim 3 of the 4 fates for that pass, if the banner ends in the first phase.
        IntertwinedFates -= Math.min(4, Math.floor(WishConfig.BPLevel / 10)); // Subtracts the amount of fates already claimed from this battle pass.

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
    var DynamicMaxWishes;
    var Lost5050s;
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

// Stub function
function AnalyticWishCalculations(WishConfig, MaxWishes) {
    // TODO: Add comments.

    const CharacterGoal = WishConfig.CharacterGoal;
    const WeaponGoal = WishConfig.WeaponGoal;

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

    var time = Date.now();

    // console.log(time);

    var KeyArray = [];
    for (var i = 0; i < 180*WishConfig.CharacterGoal; i++) {
        transitions = {}
        transitions['ID'] = i

        if ( (Math.floor(i/180) + 1) < WishConfig.CharacterGoal) {
            NextChar = WishConfig.CharacterGoal[Math.floor(i/180)+1]
        } 
        else{
            NextChar = 'Finished'
        }

        if (i >= 180*WishConfig.CharacterGoal - 1) {
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
    states['Finished-0-0'] =  {'ID': `${180*WishConfig.CharacterGoal}`, 'Finished-0-0': 1}

    console.log(`States Generated: ${((Date.now() - time)/1000).toFixed(4)}\n`);
    time = Date.now();

    let stateTransformations = [];
    let rowTransformations;
    let TransationProbability;
    let iterKey;
    var Char;

    for (const [key, value] of Object.entries(states)) {
        rowTransformations = new Array(Object.keys(states).length).fill(0)

        for (const [SubKey, SubValue] of Object.entries(value)) {
            if (SubKey != 'ID') {
                rowTransformations[states[SubKey].ID] = SubValue
            }
        }

        stateTransformations.push(rowTransformations)
    };


    console.log(`Transition Matrix Generated: ${((Date.now() - time)/1000).toFixed(4)}\n`)
    time = Date.now();

 
    var stateTransformationsMatrix = math.matrix(stateTransformations, 'sparse')
  
    let MaxWishesBin = (MaxWishes >>> 0).toString(2);
    let ReverseMaxWishesBin = MaxWishesBin.split('').reverse().join('');
    
    console.log(`Matrix Power 1: ${((Date.now() - time)/1000).toFixed(4)}\n`);
    time = Date.now();

    var FinalStateTransformationMatrix = math.identity(Object.keys(states).length);
    var newMat = stateTransformationsMatrix;
    for (var i = 0; i < MaxWishesBin.length ; i++) {
        console.log(`Matrix Power ${Math.pow(2, i)}: ${((Date.now() - time)/1000).toFixed(4)}\n`);
        time = Date.now();
        
        if(ReverseMaxWishesBin[i] == '1') {

            FinalStateTransformationMatrix = math.multiply(FinalStateTransformationMatrix, newMat);
        }

        if (i < MaxWishesBin.length - 1) {
            newMat = math.multiply(newMat, newMat);
        }
    };

    console.log(`Finished: ${((Date.now() - time)/1000).toFixed(4)}`);

    console.log(`${(math.subset(FinalStateTransformationMatrix, math.index(WishConfig.CharacterPity, Object.keys(states).length-1))*100).toFixed(2)}%`);

}

function WishCalcs(WishConfig) {

    Object.assign(WishConfig, PatchAndDateCalculator(WishConfig));

    $('#WishEndDate').show().html(`Wishing End Date: ${WishConfig.WishingEndDate.toLocaleDateString("en-US")}`);

    if (WishConfig.WishingEndDate < Today) {
        $('#BannerEnded').show().html('Banner has already ended.');
        return ''
    }

    const MaxWishes = SavingsCalculator(WishConfig);

    $('#MaxWishes').show().html(`Max Number of Wishes: ${MaxWishes}`);

    var WishingFor = 'Wishing for ';

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