// NA region's start date for version 4 in est. Since (almost) all patches are exactly six weeks, we can use this date to calculate the start and end dates for other patches.
const v4StartDate = moment('2023-8-15', "YYYY-MM-DD").toDate();
let BannerInfo = [];
let LastBannerInfo;
let Trials = 100000;

let Today = new Date();
Today.setHours(0,0,0,0);

function DateAdd(date, days) {
    const newDate = new Date(date);
    
    newDate.setDate(date.getDate() + days);
    
    return newDate;
}

function DateDiff(DateFrom, DateTo) {
    return Math.floor((DateTo - DateFrom)/(1000 * 60 * 60 * 24));
}

function GetBannerInfo() {
    let Patch = 40; // Using integers so we don't have to deal with floats.

    let PatchDiff = 0; // This will track how many patches are between the current patch and any subsequent patches.
    let BannerEndDate = DateAdd(v4StartDate, 21);

    let TotalPhaseDiff = 0;
    let PhaseDiffFromCurrentBanner = -1; //Since we only care about this value for active banners so we can have it start at -1.

    let First = true
    while (PatchDiff <= 25) {
        if (!First) { // Since we are starting with 4.0 phase 1, we don't want to increae the patch/phase on the first iteration.
            BannerEndDate = DateAdd(BannerEndDate, 21);
            TotalPhaseDiff++;
            
            // Increase the patch everytime we reach a phase 1 banner. If the patch is a ".8" then the next patch should be a ".0".
            if (TotalPhaseDiff % 2 == 0) {
                if ((Patch % 10) == 8) {
                    Patch += 2;
                }
                else {
                  Patch++;
                }
            }
        }
        else {
            First = false
        }

        if (BannerEndDate > Today) {
            // Increase the patch diff everytime we reach a phase 1 banner, unless its the current banner.
            if ((TotalPhaseDiff % 2 == 0) && DateDiff(Today, BannerEndDate) > 21) {
                PatchDiff += 1;  
            }

            $('#BannerEnd').append($('<option>', {
                value: TotalPhaseDiff,
                text: `${(Patch/10).toFixed(1)} Phase ${(TotalPhaseDiff % 2) + 1} (Ends on ${moment(BannerEndDate, "YYYY-MM-DD").format('L')})`,
            }));

            PhaseDiffFromCurrentBanner++
        }

        BannerInfo.push({
            'MonthDiff': 12 * (BannerEndDate.getFullYear() - Today.getFullYear()) + (BannerEndDate.getMonth() - Today.getMonth()),
            'PatchDiff': PatchDiff,
            'Phase': (TotalPhaseDiff % 2) + 1,
            'BannerEndDate': BannerEndDate,
            'PatchStartDate': DateAdd(BannerEndDate, -21*((TotalPhaseDiff % 2) + 1)),
            'Patch': (Patch/10).toFixed(1),
            'PhaseDiff': PhaseDiffFromCurrentBanner
        });

    }
}

function SavingsCalculator(WishConfig) {
    let CurrentBannerVal = $('#BannerEnd')[0].options[0].value;

    // TODO: Could maybe go a bit more in depth.
    let Primos = WishConfig.Primos;

    if(!WishConfig.SimpleMode) {
        // 40 primos from character trials, every banner. Assumes that this banner's trial primos have already been claimed.
        Primos += 40*(LastBannerInfo.PhaseDiff);
        
        Primos += DateDiff(Today, LastBannerInfo.BannerEndDate) * ( 60 + (WishConfig.HasWelkin ? 90 : 0) ); // 60 primos for dailies plus 90 for welkin, if purchased.

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
        let AbyssCycles = LastBannerInfo.MonthDiff - WishConfig.AbyssCurrentCycleCompleted;
        
        // Since the abyss resets on the 16th of each month, the calculations needed to get the number of abyss cycles, are slightly different.
        if (LastBannerInfo.BannerEndDate.getDate() >= 16) {
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
        Primos += ExpectedTheaterPrimos * (LastBannerInfo.MonthDiff + (1 - WishConfig.ITCurrentCycleCompleted));
        
        // Live Stream Primos
        // If there are any patches after the current patch, then we will add 300 primos for each of them, unless the final banner ends in the first phase. In which case we will add 300 for all but the final patch as we would finish wishing before the it's live stream airs.
        // TODO: Could maybe go a bit more in depth.
        if (LastBannerInfo.PatchDiff > 0) {
            if (LastBannerInfo.Phase == 1) {
                Primos += 300 * (LastBannerInfo.PatchDiff - 1);

            }
            else {
                Primos += 300 * LastBannerInfo.PatchDiff;
            }
        }

        // Adding in the current patches primos for the live steam, if applicable. Live streams generally air on the second to last Friday of a patch, or 31 days into the patch. 
        // If we are 31 or more days into the patch, then the user should have already been able to claim the primos, thus we no longer need to account for them. 
        // If the current patch is also the final patch, for wishing, then wishing will have to go into the second phase in order to claim the primos.
        if ( (LastBannerInfo.PatchDiff > 0 || LastBannerInfo.Phase === 2) && (DateDiff(BannerInfo[CurrentBannerVal].PatchStartDate, Today) < 31) ) {
            Primos += 300;
        }

        // Maintenance
        // TODO: Could maybe go a bit more in depth.
        Primos += 300 * LastBannerInfo.PatchDiff;

        if (WishConfig.EnableEventCalcs) {

            if (LastBannerInfo.PatchDiff > 0) {
                if (!WishConfig.FlagshipEventCompleted) {
                    Primos += 900;
                }

                Primos += (3 - WishConfig.SecondaryEventsCompleted) * 420

                Primos += (900 + 3*420) * (LastBannerInfo.PatchDiff - 1);

                // User's should only know the events schedule as far out as the end of the next banner. 
                // For phase 1 banners farther out than that we will assume that only one secondary event can be completed and the flagship event cannot be completed.
                if (LastBannerInfo.PhaseDiff > 1) {
                    WishConfig.FlagshipEventCompletable = false;
                    WishConfig.SecondaryEventsCompletable = 1;
                }

                if ((LastBannerInfo.Phase == 2) || WishConfig.FlagshipEventCompletable) {
                    Primos += 900;
                };

                if ((LastBannerInfo.Phase == 2) ) {
                    Primos += 3*420;
                }
                else {
                    Primos += WishConfig.SecondaryEventsCompletable * 420;
                };
            }
            else {
                if (
                    ( (LastBannerInfo.Phase == 2) || WishConfig.FlagshipEventCompletable )
                    && !WishConfig.FlagshipEventCompleted
                ) {
                    Primos += 900;
                };

                if ((LastBannerInfo.Phase == 2) ) {
                    Primos += (3 - WishConfig.SecondaryEventsCompleted) * 420
                }
                else {
                    Primos += (WishConfig.SecondaryEventsCompletable - WishConfig.SecondaryEventsCompleted) * 420
                };
            };
        };
    }

    // TODO: Could maybe go a bit more in depth.
    let IntertwinedFates = WishConfig.IntertwinedFates;

    // TODO: Could maybe go a bit more in depth.
    let Starglitter;
    if (WishConfig.UsingStarglitter) {
        IntertwinedFates += Math.floor(WishConfig.Starglitter / 5);
        Starglitter = WishConfig.Starglitter % 5;
    }
    
    if (!WishConfig.SimpleMode) {

        // Up to five Intertwined Fates can be purchased every month from the Stardust Exchange.
        // Assumes that the current month's supply has already been purchased.
        // If the Stardust field is left empty then it will be assumed that all available Intertwined Fates can be purchased.
        if (WishConfig.Stardust === '') {
            IntertwinedFates += 5 * LastBannerInfo.MonthDiff;
        }
        else {
            IntertwinedFates += Math.min(5 * LastBannerInfo.MonthDiff, Math.floor(WishConfig.Stardust / 75));
        }

        // TODO: Could maybe go a bit more in depth.
        if (WishConfig.BPPurchased) {
            IntertwinedFates += Math.max(0, (LastBannerInfo.Phase === 1 ? 3 : 4) + 4 * LastBannerInfo.PatchDiff - Math.min(4, Math.floor(WishConfig.BPLevel / 10))); 
            // Assumes that the user will only be able to claim 3 of the 4 fates for that pass, if the banner ends in the first phase. 
            // Also, subtracts the amount of fates already claimed from this battle pass.
            // Subtracting the claimed interwined fates has to be done on the same line so it can be wrapped in the max function as there is an edge case where
            //      the user can earn 4 intertwined from the pass while the system is only expecting 3 to be claimable and so it would result in -1 fates being expected from the pass.

            Primos += 680 * ((LastBannerInfo.Phase === 2 ? 1 : 0) + LastBannerInfo.PatchDiff); // Assumes that the user won't reach level 50 for that pass, if the banner ends in the first phase.
            if (WishConfig.BPLevel === 50) { // Subtracts 680, if the primos have already been claimed for this pass.
                Primos -= 680;
            }
        }
    }


    // TODO: Could maybe go a bit more in depth.
    let WishesMade = Math.floor(Primos/160) + IntertwinedFates;

    // TODO: Could maybe go a bit more in depth.
    if (WishConfig.UsingStarglitter) {
        let FourStars = Math.floor(WishesMade / 10);
        let FourStarPity = WishesMade % 10;
        // TODO: Add a comment regarding why this doesn't differentiate for on banner and off banner four stars.
        Starglitter += Math.max(0, 2 * (FourStars - (WishConfig.MissingFourStars + LastBannerInfo.PatchDiff)));
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

let Wishes;
let Lost5050s;
let NonGuaranteeCharacterWinChance;
let CapturingRadiancePity;

let CharacterPity;
let CharacterGuarantee;
let Characters;
let CharacterRate;

let WeaponPity;
let WeaponGuarantee;
let WeaponFatePoints;
let Weapons;
let WeaponRate;

let ChronicledPity;
let ChronicledFatePoints;
let ChronicledItems;
let ChronicledRate;

function NumericWishCalculations(WishConfig, MaxWishes) {
    // TODO: Add comments.
    Wishes = 0;
    let Successes = 0;
    let Start = Date.now();

    let TrialCount;
    for (TrialCount = 1; TrialCount <= Trials; TrialCount++) {

        Lost5050s = 0
        Wishes = 0;

        CharacterPity = WishConfig.CharacterPity;
        CharacterGuarantee = WishConfig.CharacterGuarantee;
        Characters = 0;
        CharacterRate = 0.006 + Math.max(0, .06*(CharacterPity-73));
        
        if (WishConfig.EnableCapturingRadiance) {
            CapturingRadiancePity = WishConfig.CapturingRadiancePity;
        }

        CharacterWishSim(WishConfig, WishConfig.CharacterGoal, MaxWishes);

        WeaponPity = WishConfig.WeaponPity;
        Guarantee = WishConfig.WeaponGuarantee;
        WeaponFatePoints = WishConfig.WeaponFatePoints;
        Weapons = 0;
        WeaponRate = 0.007 + Math.max(.07*(WeaponPity-61), 0);

        WeaponWishSim(WishConfig, WishConfig.WeaponGoal, MaxWishes);

        ChronicledPity = WishConfig.ChronicledPity;
        ChronicledFatePoints = WishConfig.ChronicledFatePoints;
        ChronicledItems = 0;
        ChronicledRate = 0.006 + Math.max(0, .06*(ChronicledPity-73));

        ChronicledWishSim(WishConfig, WishConfig.WeaponGoal, MaxWishes);

        if (Characters >= WishConfig.CharacterGoal && Weapons >= WishConfig.WeaponGoal && ChronicledItems >= WishConfig.ChronicledGoal) {
            Successes++;
        }

        if (Date.now() - Start > 5000) {
            break;
        }
    }

    // TODO: See if there is a built in function for this.
    return ((Successes / TrialCount)*100).toFixed(2);
}

function CharacterWishSim(WishConfig, CharacterGoal, MaxWishes) {
    while (Characters < WishConfig.CharacterGoal && Wishes < MaxWishes) {
        Wishes++;
        CharacterPity++;

        if (CharacterPity >= 74) {
            CharacterRate += 0.06;
        }

        if (Math.random() <= CharacterRate) {
            CharacterRate = 0.006;
            CharacterPity = 0;

            if (!WishConfig.EnableCapturingRadiance) {
                NonGuaranteeCharacterWinChance = 0.500
            }
            else {  
                switch (CapturingRadiancePity) {
                    case 0: NonGuaranteeCharacterWinChance = 0.500; break;
                    case 1: NonGuaranteeCharacterWinChance = 0.525; break;
                    case 2: NonGuaranteeCharacterWinChance = 0.750; break;
                    case 3: NonGuaranteeCharacterWinChance = 1.000; break;
                };
            };

            if (CharacterGuarantee || (Math.random() < NonGuaranteeCharacterWinChance)) {
                if (!CharacterGuarantee) {
                    CapturingRadiancePity = 0;
                }

                Characters++;
                CharacterGuarantee = 0;
            } else {
                CharacterGuarantee = 1;
                Lost5050s++;
                CapturingRadiancePity++;

                if ( WishConfig.UsingStarglitter && (Lost5050s > WishConfig.MissingFiveStars) ){
                    Wishes -= 2 // You get enough starglitter from five star cons to make two additional wishes.
                }
            }
        }
    }
}

function WeaponWishSim(WishConfig, CharacterGoal, MaxWishes) {
    while (Weapons < WishConfig.WeaponGoal && Wishes < MaxWishes) {
        Wishes++;
        WeaponPity++;

        if (WeaponPity >= 63) {
            WeaponRate += 0.07;
        }

        if (Math.random() <= WeaponRate) {
            WeaponRate = 0.007;
            WeaponPity = 0;
            
            if (WishConfig.UsingStarglitter) {
                Wishes -= 2 // You get enough starglitter from five stars to make two additional wishes.
            }

            let r = Math.random();

            if (WeaponFatePoints === 1 || (WeaponGuarantee && r <= 0.5) || (r <= 0.375)) {
                Weapons++;
                WeaponGuarantee = 0;
                WeaponFatePoints = 0;
            } else if (WeaponGuarantee || (r <= 0.75)) {
                WeaponGuarantee = 0;
                WeaponFatePoints++;
            } else {
                WeaponGuarantee = 1;
                WeaponFatePoints++;
            }
        }
    }
}

function ChronicledWishSim(WishConfig, CharacterGoal, MaxWishes) {
    while (ChronicledItems < WishConfig.ChronicledGoal && Wishes < MaxWishes) {
        Wishes++;
        ChronicledPity++;

        if (ChronicledPity >= 74) {
            ChronicledRate += 0.06;
        }

        if (Math.random() <= ChronicledRate) {
            ChronicledRate = 0.006;
            ChronicledPity = 0;

            if (ChronicledFatePoints >= 1 || (Math.random() < 0.5)) {
                ChronicledItems++;
                ChronicledFatePoints = 0;
            } else {
                ChronicledFatePoints++;
            }
        }
    }
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
    LastBannerInfo = BannerInfo[WishConfig.BannerEnd];

    $('#BannerEnded').hide();
    $('#WishEndDate').hide();
    
    if (!WishConfig.SimpleMode) {
        // While the Banner End dropdown should prevent the user from selecting an end date that is in the past, we will leave it here for any edge cases that may occur.
        if (LastBannerInfo.BannerEndDate < Today) {
            $('#BannerEnded').show().html('Banner has already ended.');
            $('#MaxWishes,#WishingGoals,#Chance').hide();
            return ''
        }
        
        $('#WishEndDate').show().html(`Wishing End Date: ${moment(LastBannerInfo.BannerEndDate, "YYYY-MM-DD").format('L')}`);
    }

    const MaxWishes = SavingsCalculator(WishConfig);

    $('#MaxWishes').show().html(`Max Number of Wishes: ${MaxWishes}`);

    let WishingFor = `Wishing for ${WishConfig.CharacterGoal} characters, ${WishConfig.WeaponGoal} weapons, and ${WishConfig.ChronicledGoal} chronicled items.`;

    $('#WishingGoals').show().html(WishingFor);

    $('#Chance').show().html(`Chances of reaching wish goals: ${NumericWishCalculations(WishConfig, MaxWishes)}%`);
}