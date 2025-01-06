// North America region's start date for version 5 in est. Since almost all patches are exactly six weeks, we can use this date to calculate the start and end dates for other patches.
const v5StartDate = moment('2024-8-27', "YYYY-MM-DD").toDate();
let BannerInfo = [];
let TargetBannerInfo;
let Trials = 10**6;

let Today = new Date();
Today.setHours(0,0,0,0);

const BannerTypeDropdownOptions = {
    CHARACTER:       {value: 1, text: 'Character'},
    WEAPON:          {value: 2, text: 'Weapon'},
    CHRONICLED_WISH: {value: 3, text: 'Chronicled Wish'}
}

function DateAdd(date, days) {
    const newDate = new Date(date);
    
    newDate.setDate(date.getDate() + days);
    
    return newDate;
}

function DateDiff(DateFrom, DateTo) {
    return Math.floor((DateTo - DateFrom)/(1000 * 60 * 60 * 24));
}

let Patch = 50; // Using ints to make things easier.
let PatchDiff = 0; // This will track how many patches are between the current patch and any subsequent patches.
let PatchStartDate = v5StartDate;
let CurrentBannerVal;
while (BannerInfo.length < 50) {
    for (let Phase = 1; Phase <= 2; Phase++) {
        let BannerEndDate = DateAdd(PatchStartDate, 21*Phase);

        if (BannerEndDate >= Today && CurrentBannerVal == undefined) {
            CurrentBannerVal = BannerInfo.length;
        };

        // We need to have banner info have consistent values since import values could have been exported during a previous banner.
        BannerInfo.push({
            'Patch': (Patch/10).toFixed(1),
            'PatchDiff': PatchDiff,
            'PatchStartDate': PatchStartDate,
            'Phase': Phase,
            'PhaseDiff': BannerInfo.length - CurrentBannerVal,
            'BannerEndDate': BannerEndDate,
            'MonthDiff': 12*(BannerEndDate.getFullYear() - Today.getFullYear()) + (BannerEndDate.getMonth() - Today.getMonth())
        });
    };

    PatchStartDate = DateAdd(PatchStartDate, 42);
    if ((Patch % 10) == 8) { // Almost all patches end after x.8 so we will go with this assumption.
        Patch += 2;
    }
    else {
        Patch += 1;
    };

    if (PatchStartDate >= Today) {
        PatchDiff++
    };
};

function SavingsCalculator(WishConfig) {
    // Primos are a currency used to purchase intertwinded fates, which will be used to make wishes.
    let Primos = WishConfig.Primos;

    if(WishConfig.WishMode != WishModes.SIMPLE.value) {
        // 40 primos from character trials, every banner. Assumes that this banner's trial primos have already been claimed.
        Primos += 40*(TargetBannerInfo.PhaseDiff);
        
        Primos += DateDiff(Today, TargetBannerInfo.BannerEndDate) * ( 60 + (WishConfig.HasWelkin ? 90 : 0) ); // 60 primos for dailies plus 90 for welkin, if purchased.

        // Abyss (Spiral Abyss) - A challenge that will give you a star ranking for how fast you beat each floor and the higher your star ranking the more primos awarded.
        let ExpectedAbyssPrimos = 0;
        const FloorVals = [WishConfig.ExpectedStarsFloor9, WishConfig.ExpectedStarsFloor10, WishConfig.ExpectedStarsFloor11, WishConfig.ExpectedStarsFloor12];
        for (let i = 0; i <= FloorVals.length; i++) {
            if (FloorVals[i] == 3) { // 9 Stars
                ExpectedAbyssPrimos += 200;
            }
            else if (FloorVals[i] == 2) { // 6-8 Stars
                ExpectedAbyssPrimos += 100;
            }
            else if (FloorVals[i] == 1) { // 3-5 Stars
                ExpectedAbyssPrimos += 50;
            };
        };
        // The abyss resets on the 16th of each month.
        let AbyssCycles = TargetBannerInfo.MonthDiff - WishConfig.AbyssCurrentCycleCompleted;
        if (TargetBannerInfo.BannerEndDate.getDate() >= 16) {
            AbyssCycles += 1;
        }
        if (Today.getDate() < 16) {
            AbyssCycles += 1;
        };
        Primos += ExpectedAbyssPrimos * AbyssCycles;

        // Theater (Imaginarium Theater) - A monthly challenge where you can earn primos for the amount of acts, that you complete.
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
        };
        Primos += ExpectedTheaterPrimos * (TargetBannerInfo.MonthDiff + (WishConfig.ITCurrentCycleCompleted ? 0 : 1));

        // Live Stream Primos - Every patch there is a live stream that will give away 300 primos to viewers.
        Primos += 300 * (TargetBannerInfo.PatchDiff + 1); // +1 for current patch.
        // Subtracting primos for current patch, if claimed. Live streams generally air 31 days into the patch so we will assume the primos are claimed on that date.
        if (DateDiff(BannerInfo[CurrentBannerVal].PatchStartDate, Today) >= 31) {
            Primos -= 300;
        };
        // Subtract primos from the last patch if the target banner is in the first phase, as then the ls primos wouldn't be claimable.
        if (TargetBannerInfo.Phase == 1) {
            Primos -= 300
        };

        // Maintenance - 300 primos will be claimable at the start of each patch as compensation for the game going down for the update.
        Primos += 300 * TargetBannerInfo.PatchDiff;

        if (WishConfig.EnableEventCalcs) {
            // Each patch there will be 1 flagship event, awarding 900 primogems and 3 secondary events, each awarding 420 primogems.
            Primos += (900 + 3*420) * (TargetBannerInfo.PatchDiff + 1); // +1 for current patch.

            // Subtracts claimed event primos.
            Primos -= WishConfig.FlagshipEventCompleted ? 900 : 0;
            Primos -= 420*WishConfig.SecondaryEventsCompleted;

            // Subtracts unclaimable event primos.
            if (TargetBannerInfo.Phase != 2) { // All events will be completable if the banner ends in the second half.
                // User's should only know the events schedule as far out as the end of the next banner. 
                // For phase 1 banners farther out than that we will assume that only one secondary event can be completed and the flagship event cannot be completed.
                if (TargetBannerInfo.PhaseDiff > 1) {
                    Primos -= 900;
                    Primos -= 2*420;
                }
                else {
                    Primos -= WishConfig.FlagshipEventCompletable ? 0 : 900;
                    Primos -= 420*(3-WishConfig.SecondaryEventsCompletable);
                };
            };
        
            // Hoyo lab check in - Awards 20 primos on the 4th, 11th, & 18th of each month for checking in daily.
            if (WishConfig.UsingHoyoLabCheckin) {
                Primos += 60*(TargetBannerInfo.MonthDiff + 1); // +1 for the current month.
                
                // Subtract based on the amount of primos we could claim.
                if      (Today.getDate() >= 18) {Primos -= 60}
                else if (Today.getDate() >= 11) {Primos -= 40}
                else if (Today.getDate() >=  4) {Primos -= 20};

                // Subtracts primos based on how many could actually be claimed by the banner end date.
                if      (TargetBannerInfo.BannerEndDate.getDate() <  4) {Primos -= 60}
                else if (TargetBannerInfo.BannerEndDate.getDate() < 11) {Primos -= 40}
                else if (TargetBannerInfo.BannerEndDate.getDate() < 18) {Primos -= 20};
            };
        };
    }

    let IntertwinedFates = WishConfig.IntertwinedFates;

    // Starglitter is given to players when they pull a character, that they already own, or a weapon. It can be used to purchase intertwined fates.
    let Starglitter;
    if (WishConfig.UsingStarglitter) {
        IntertwinedFates += Math.floor(WishConfig.Starglitter / 5);
        Starglitter = WishConfig.Starglitter % 5;
    }
    
    if (WishConfig.WishMode != WishModes.SIMPLE.value) {
        // Up to five Intertwined Fates can be purchased every month from the Stardust Exchange.
        // Assumes that the current month's supply has already been purchased.
        // If the Stardust field is left empty then it will be assumed that all available Intertwined Fates can be purchased.
        if (WishConfig.Stardust === '') {
            IntertwinedFates += 5 * TargetBannerInfo.MonthDiff;
        }
        else {
            IntertwinedFates += Math.min(5 * TargetBannerInfo.MonthDiff, Math.floor(WishConfig.Stardust / 75));
        };

        // Battle pass - Allows you to earn primos and fates for completing missions and leveling your pass.
        if (WishConfig.BPPurchased) {
            // Fates are awarded on the 10th, 20th, 30th, & 40th levels of the pass.
            // Assumes that the user will only be able to claim 3 of the 4 fates for a pass, if the banner ends in the first phase, as there is a cap on how much exp can be earned per week.
            // Also, subtracts the amount of fates already claimed from this battle pass.
            // The max function accounts for the possibility of reaching level 40, while in the first phase, through special missions, which lets the claimed number of fates be greater than the claimable amount.
            IntertwinedFates += 4 * TargetBannerInfo.PatchDiff + Math.max(0, (TargetBannerInfo.Phase == 1 ? 3 : 4) - Math.min(4, WishConfig.BPLevel)); 

            // 680 primos are awarded at level 50.
            Primos += 680 * ((TargetBannerInfo.Phase === 2 ? 1 : 0) + TargetBannerInfo.PatchDiff); // Assumes that the user won't reach level 50 in the first phase.
            if (WishConfig.BPLevel === 5) { // Subtracts if the primos have already been claimed for this pass.
                Primos -= 680;
            };
        };

        // There are three bp missions to "Enhance 5-star artifacts a total of 30/60/100 levels".
        // The rewards add up to 60 primos, are not time gated, and don't require purchasing the pass.
        Primos += 60*TargetBannerInfo.PatchDiff;
    };

    let WishesMade = Math.floor(Primos/160) + IntertwinedFates;

    // Adds starglitter for four stars that were pulled. Assumes that we would earn one four star every ten wishes.
    // For simplicity this won't account for whether the four stars have a rate up. Assumes 2 starglitter for four star.
    if (WishConfig.UsingStarglitter) {
        let FourStars = Math.floor(WishesMade/10);
        let FourStarPity = WishesMade % 10;

        // Won't get starglitter for newly acquired four stars. Adds up the number of currently missing four stars plus those that may be added in future patches. 
        // Assumes that one will be added per patch to err on the side of caution, although this often won't be the case.
        Starglitter += Math.max(0, 2 * (FourStars - (WishConfig.MissingFourStars + TargetBannerInfo.PatchDiff)));

        let AdditionalWishesMade;
        let AdditionalFourStars;
        while (Starglitter >= 5) {
            AdditionalWishesMade = Math.floor(Starglitter/5);
            Starglitter %= 5;
            AdditionalFourStars = Math.floor((AdditionalWishesMade + FourStarPity)/10);
            FourStarPity = (AdditionalWishesMade + FourStarPity) % 10;
            Starglitter += 2 * AdditionalFourStars; // Missing four stars don't factor in here since this code wouldn't run if we were still missing any.

            WishesMade += AdditionalWishesMade;
        };
    };

    return WishesMade;
};

// Declaring variables outside the function scope so they can be used by both NumericWishCalculations and the wish sim functions.
let Wishes;
let LostCharacter5050s; // A "50:50" is the unofficial term for when you pull a five star without having a 100% chance of getting the desired five star.
let CapturingRadiancePity; // Explained in a tool tip on the calculator's site.

// Pity: Builds up as you wish for an item and increases your chance of success after reaching a certain amount. Resets when you get a five star.
// Guarantee: Chance of getting an event item.
// Rate: Current chance of success for an individual pull.
// Fate points: Builds when you get a five star other than the one you wanted. Will guarantee you get the one you want once it reaches a certain amount. Resets when you get the one you want.

let CharacterPity;
let CharacterGuarantee;
let CharacterRate;

let WeaponPity;
let WeaponGuarantee;
let WeaponFatePoints;
let WeaponRate;

let ChronicledPity;
let ChronicledFatePoints;
let ChronicledRate;

function NumericWishCalculations(WishConfig) {
    let Successes = 0;
    let Start = Date.now();

    let wishPlanResults = {};
    let ModifiedWishPlanMapper = [];
    for (const i of WishConfig.wishPlanMapper) {
        if (WishConfig[`WishPlanEnabled${i}`]) {
            wishPlanResults[i] = 0;
            ModifiedWishPlanMapper.push(i);
        };
    };

    let TrialCount;
    for (TrialCount = 0; TrialCount < Trials; TrialCount++) {
        Wishes = 0;
        LostCharacter5050s = 0;

        CharacterPity = WishConfig.CharacterPity;
        CharacterGuarantee = WishConfig.CharacterGuarantee;
        CharacterRate = 0.006 + Math.max(0, .06*(CharacterPity-73));
        CapturingRadiancePity = WishConfig.CapturingRadiancePity;

        WeaponPity = WishConfig.WeaponPity;
        WeaponGuarantee = WishConfig.WeaponGuarantee;
        WeaponFatePoints = WishConfig.WeaponFatePoints;
        WeaponRate = 0.007 + Math.max(.07*(WeaponPity-61), 0);

        ChronicledPity = WishConfig.ChronicledPity;
        ChronicledFatePoints = WishConfig.ChronicledFatePoints;
        ChronicledRate = 0.006 + Math.max(0, .06*(ChronicledPity-73));

        if (WishConfig.WishMode != WishModes.ADVANCED.value) {
            let CharactersWon = CharacterWishSim(WishConfig, WishConfig.CharacterGoal, WishConfig.MaxWishes);

            let WeaponsWon = WeaponWishSim(WishConfig, WishConfig.WeaponGoal, WishConfig.MaxWishes);

            let ChronicledItemsWon = ChronicledWishSim(WishConfig, WishConfig.ChronicledGoal, WishConfig.MaxWishes);

            if (CharactersWon && WeaponsWon && ChronicledItemsWon) {
                Successes++;
            };
        }
        else {
            let MissedFiveStars = false;
            let WishGroupMaxWishes = WishConfig[`WishPlanMaxWishes${ModifiedWishPlanMapper[0]}`];
            for (const i of ModifiedWishPlanMapper) {
                if (WishGroupMaxWishes < WishConfig[`WishPlanMaxWishes${i}`]) {
                    WishGroupMaxWishes = WishConfig[`WishPlanMaxWishes${i}`];
                    
                    WeaponFatePoints = 0;
                    ChronicledFatePoints = 0;
                };

                let WishItemsWon;
                switch (WishConfig[`WishPlanType${i}`]) {
                    case BannerTypeDropdownOptions['CHARACTER'].value:
                        WishItemsWon = CharacterWishSim(WishConfig, WishConfig[`WishPlanGoal${i}`], WishGroupMaxWishes);
                        break;
                    case BannerTypeDropdownOptions['WEAPON'].value: 
                        WishItemsWon = WeaponWishSim(WishConfig, WishConfig[`WishPlanGoal${i}`], WishGroupMaxWishes);
                        break;
                    case BannerTypeDropdownOptions['CHRONICLED_WISH'].value: 
                        WishItemsWon = ChronicledWishSim(WishConfig, WishConfig[`WishPlanGoal${i}`], WishGroupMaxWishes);
                        break;
                };

                if (WishItemsWon) {
                    wishPlanResults[i]++;
                }
                else {
                    MissedFiveStars = true;
                };
            };

            if (MissedFiveStars == false) {
                Successes++
            };
        };

        if (Date.now() - Start > 5000) { // Sets a 5 second time limit on wish calcs.
            TrialCount += 1
            break;
        };
    };

    for (const i of ModifiedWishPlanMapper) {
        wishPlanResults[i] = ((wishPlanResults[i] / TrialCount)*100).toFixed(1)+'%';
    };

    return ({
        TotalSuccessRate: ((Successes / TrialCount)*100).toFixed(1)+'%', 
        wishPlanResults: wishPlanResults
    });
};

function CharacterWishSim(WishConfig, CharacterGoal, MaxWishes) {
    let Characters = 0;

    let FiveStarChance = Math.random();
    let NonFiveStarChance = 1;
    let CharacterFiveStarWinRates = [0.5, 0.525, 0.75, 1];
    while (Wishes < MaxWishes) {
        Wishes++;
        CharacterPity++;

        if (CharacterPity >= 74) {
            CharacterRate += 0.06;
        };

        NonFiveStarChance *= (1 - CharacterRate);

        if (FiveStarChance > NonFiveStarChance) {
            CharacterRate = 0.006;
            CharacterPity = 0;

            if (CharacterGuarantee || (Math.random() < CharacterFiveStarWinRates[ (WishConfig.EnableCapturingRadiance ? CapturingRadiancePity : 0) ])) {
                if (!CharacterGuarantee) {
                    CapturingRadiancePity = 0;
                };

                Characters++;
                CharacterGuarantee = 0;

                if (Characters >= CharacterGoal) {
                    return true;
                };
            }
            else {
                CharacterGuarantee = 1;
                LostCharacter5050s++;
                CapturingRadiancePity++;

                if (WishConfig.UsingStarglitter && (LostCharacter5050s > WishConfig.MissingFiveStars)){
                    Wishes -= 2 // You get enough starglitter from five star cons to make two additional wishes.
                };
            };

            FiveStarChance = Math.random();
            NonFiveStarChance = 1;
        };
    };

    return false;
};

function WeaponWishSim(WishConfig, WeaponGoal, MaxWishes) {
    let Weapons = 0;

    let FiveStarChance = Math.random();
    let NonFiveStarChance = 1;
    while (Wishes < MaxWishes) {
        Wishes++;
        WeaponPity++;

        if (WeaponPity >= 63) {
            WeaponRate += 0.07;
        };

        NonFiveStarChance *= (1 - WeaponRate);

        if (FiveStarChance > NonFiveStarChance) {
            WeaponRate = 0.007;
            WeaponPity = 0;

            if (WishConfig.UsingStarglitter) {
                Wishes -= 2 // You get enough starglitter from five star weapons to make two additional wishes.
            };

            let r = Math.random();
            // 1 fate point will get you your desired weapon, while having the guarantee will make it a 50:50 between your desired weapon and the other event weapon, while having neither will make it a 3/8 chance.
            if (WeaponFatePoints === 1 || (WeaponGuarantee && r <= 0.5) || (r <= 0.375)) {
                Weapons++;
                WeaponGuarantee = 0;
                WeaponFatePoints = 0;

                if (Weapons >= WeaponGoal) {
                    return true;
                };
            }
            // If you got an event weapon, either through the guarantee or the 75% chance, but didn't get your desired weapon then you must have gotten the other event weapon.
            else if (WeaponGuarantee || (r <= 0.75)) {
                WeaponGuarantee = 0;
                WeaponFatePoints++;
            }
            // 25% chance to have gotten a standard banner weapon.
            else {
                WeaponGuarantee = 1;
                WeaponFatePoints++;
            };

            FiveStarChance = Math.random();
            NonFiveStarChance = 1;
        };
    };

    return false;
};

function ChronicledWishSim(WishConfig, ChronicledGoal, MaxWishes) {
    let ChronicledItems = 0;

    let FiveStarChance = Math.random();
    let NonFiveStarChance = 1;
    while (Wishes < MaxWishes) {
        Wishes++;
        ChronicledPity++;

        if (ChronicledPity >= 74) {
            ChronicledRate += 0.06;
        };

        NonFiveStarChance *= (1 - ChronicledRate);

        if (FiveStarChance > NonFiveStarChance) {
            ChronicledRate = 0.006;
            ChronicledPity = 0;

            if (ChronicledFatePoints >= 1 || (Math.random() < 0.5)) {
                ChronicledItems++;
                ChronicledFatePoints = 0;

                if (ChronicledItems >= ChronicledGoal) {
                    return true;
                };
            }
            else {
                ChronicledFatePoints++;
            };
            
            FiveStarChance = Math.random();
            NonFiveStarChance = 1;
        };
    };

    return false;
};

function WishCalcs(WishConfig) {
    if (WishConfig.WishMode != WishModes.ADVANCED.value) {
        
        TargetBannerInfo = BannerInfo[WishConfig.BannerEnd];

        if (WishConfig.WishMode != WishModes.SIMPLE.value) {
            // While the Banner End dropdown should prevent the user from selecting an end date that is in the past, we will leave it here for any edge cases that may occur.
            if (TargetBannerInfo.BannerEndDate < Today) {
                $('#WishError').show().html('Banner has already ended.');
                return {Success: false}
            }
            
            $('#WishEndDate').show().html(`Wishing End Date: ${moment(TargetBannerInfo.BannerEndDate, "YYYY-MM-DD").format('L')}`);
        };

        WishConfig.MaxWishes = SavingsCalculator(WishConfig);

        $('#MaxWishes').show().html(`Max Number of Wishes: ${WishConfig.MaxWishes}`);

        $('#WishingGoals').show().html(`Wishing for ${WishConfig.CharacterGoal} characters, ${WishConfig.WeaponGoal} weapons, and ${WishConfig.ChronicledGoal} chronicled items.`);

        $('#Chance').show().html(`Chances of reaching wish goals: ${NumericWishCalculations(WishConfig).TotalSuccessRate}`);

        return {Success: true};
    }
    else {
        let ixMaxWishes;
        let ixBannerEnd = -1;
        for (const i of WishConfig.wishPlanMapper) {
            if (WishConfig[`WishPlanEnabled${i}`]) {

                if (WishConfig[`WishPlanBannerEnd${i}`] > ixBannerEnd) {
                    ixBannerEnd = WishConfig[`WishPlanBannerEnd${i}`];
                    TargetBannerInfo = BannerInfo[ixBannerEnd];

                    WishConfig[`WishPlanMaxWishes${i}`] = SavingsCalculator(WishConfig);
                    ixMaxWishes = WishConfig[`WishPlanMaxWishes${i}`]
                }
                else if (WishConfig[`WishPlanBannerEnd${i}`] == ixBannerEnd) {
                    WishConfig[`WishPlanMaxWishes${i}`] = ixMaxWishes
                }
                else {
                    $('#WishError').show().html('Banner end dates must be in ascending order.');
                    return {Success: false};
                };
            };
        };

        wishResults = NumericWishCalculations(WishConfig);

        $('#WishPlanningResultsTable .WishPlanResultsRow').remove();

        for (const i of WishConfig.wishPlanMapper) {
            if (WishConfig[`WishPlanEnabled${i}`]) {
                let BannerEndVal = WishConfig[`WishPlanBannerEnd${i}`];
                let BannerEndText = $(`#BannerEnd option[value=${BannerEndVal}]`).text();

                let newRow = $(
                    `<tr class="WishPlanResultsRow">`+
                        `<td>${WishConfig[`WishPlanItem${i}`]}</td>`+
                        `<td>${BannerEndText}</td>`+
                        `<td>${WishConfig[`WishPlanGoal${i}`]}</td>`+
                        `<td>${WishConfig['WishPlanMaxWishes'+i]}</td>`+
                        `<td>${wishResults.wishPlanResults[i]}</td>`+
                    `</tr>`
                );

                $('#WishPlanningResultsBody').append(newRow);
            };
        };

        $('#WishPlanningResultsTable tfoot').append($(
            `<tr class="WishPlanResultsRow">`+
                `<td colspan="5"><b>Chances of reaching all wish goals: ${wishResults.TotalSuccessRate}</b></td>`+
            `</tr>`
        ));

        $('#WishPlanningResultsTable').show();

        return {Success: true};
    };
};