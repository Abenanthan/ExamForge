const db = require('./db');

const replacements = [
  // --- NUMBER SYSTEM ---
  {
    id: 3004,
    question_text: "What is the remainder when 2^31 is divided by 5?",
    option_a: "1",
    option_b: "2",
    option_c: "3",
    option_d: "4",
    correct_option: "C",
    difficulty: "Hard",
    explanation: "2^1=2, 2^2=4, 2^3=8=3 (mod 5), 2^4=16=1 (mod 5). Since 31 = 4*7 + 3, 2^31 is congruent to 2^3 = 8 = 3 (mod 5)."
  },
  {
    id: 3005,
    question_text: "Find the Highest Common Factor (HCF) of 108, 288, and 360.",
    option_a: "18",
    option_b: "24",
    option_c: "36",
    option_d: "72",
    correct_option: "C",
    difficulty: "Hard",
    explanation: "Prime factorizations: 108 = 2^2 * 3^3, 288 = 2^5 * 3^2, 360 = 2^3 * 3^2 * 5. HCF = 2^2 * 3^2 = 4 * 9 = 36."
  },
  {
    id: 3006,
    question_text: "The product of two numbers is 2028 and their HCF is 13. How many such pairs of numbers are possible?",
    option_a: "1",
    option_b: "2",
    option_c: "3",
    option_d: "4",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Let numbers be 13x and 13y where x, y are co-prime. 13x * 13y = 2028 => 169xy = 2028 => xy = 12. Co-prime pairs (x,y) with product 12 are (1,12) and (3,4). So 2 pairs exist: (13, 156) and (39, 52)."
  },
  {
    id: 3007,
    question_text: "What smallest number must be added to 1056 so that the sum is completely divisible by 23?",
    option_a: "2",
    option_b: "3",
    option_c: "18",
    option_d: "21",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "1056 divided by 23 gives quotient 45 and remainder 21. Required number to add = 23 - 21 = 2."
  },
  {
    id: 3008,
    question_text: "Find the total number of prime factors of (2^10) * (3^5) * (7^3).",
    option_a: "3",
    option_b: "18",
    option_c: "160",
    option_d: "180",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "The total number of prime factors (counting multiplicities) is the sum of exponents: 10 + 5 + 3 = 18."
  },

  // --- NUMBER SERIES ---
  {
    id: 3009,
    question_text: "Find the missing number in the series: 4, 9, 25, 49, 121, ?",
    option_a: "144",
    option_b: "169",
    option_c: "196",
    option_d: "225",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "The numbers are squares of prime numbers: 2^2=4, 3^2=9, 5^2=25, 7^2=49, 11^2=121. The next prime is 13, so 13^2 = 169."
  },
  {
    id: 3010,
    question_text: "Find the wrong number in the given series: 2, 5, 11, 23, 47, 96.",
    option_a: "11",
    option_b: "23",
    option_c: "47",
    option_d: "96",
    correct_option: "D",
    difficulty: "Hard",
    explanation: "Pattern: x * 2 + 1. 2*2+1=5; 5*2+1=11; 11*2+1=23; 23*2+1=47; 47*2+1=95. Therefore, 96 is wrong and should be 95."
  },
  {
    id: 3011,
    question_text: "Find the next term in the series: 2, 3, 8, 27, 112, ?",
    option_a: "336",
    option_b: "448",
    option_c: "565",
    option_d: "672",
    correct_option: "C",
    difficulty: "Hard",
    explanation: "Pattern: 2*1+1=3, 3*2+2=8, 8*3+3=27, 27*4+4=112, 112*5+5=565."
  },
  {
    id: 3012,
    question_text: "What will come in place of the question mark? 12, 14, 18, 26, 42, ?",
    option_a: "64",
    option_b: "74",
    option_c: "84",
    option_d: "96",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Differences between terms are powers of 2: +2, +4, +8, +16. Next difference is +32. 42 + 32 = 74."
  },

  // --- PERCENTAGES ---
  {
    id: 3013,
    question_text: "If the price of sugar increases by 25%, by what percentage must a household reduce its consumption to keep expenditure constant?",
    option_a: "15%",
    option_b: "20%",
    option_c: "25%",
    option_d: "30%",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Percentage reduction = (R / (100 + R)) * 100 = (25 / 125) * 100 = 20%."
  },
  {
    id: 3014,
    question_text: "The population of a town increases by 10% in the first year and decreases by 10% in the second year. What is the net percentage change in population after 2 years?",
    option_a: "0%",
    option_b: "1% increase",
    option_c: "1% decrease",
    option_d: "2% decrease",
    correct_option: "C",
    difficulty: "Hard",
    explanation: "Net change = (1 + 0.10) * (1 - 0.10) = 1.10 * 0.90 = 0.99 = 99% of original. Net change = 1% decrease."
  },
  {
    id: 3015,
    question_text: "In an examination, a student must get 40% marks to pass. A student scores 175 marks and fails by 25 marks. What are the maximum marks?",
    option_a: "400",
    option_b: "500",
    option_c: "600",
    option_d: "750",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Passing marks = 175 + 25 = 200. Since 40% of Max = 200, Max marks = (200 / 40) * 100 = 500."
  },
  {
    id: 3016,
    question_text: "If A's salary is 20% more than B's salary, by what percentage is B's salary less than A's salary?",
    option_a: "16.67%",
    option_b: "20%",
    option_c: "25%",
    option_d: "33.33%",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Percentage less = (20 / (100 + 20)) * 100 = (20 / 120) * 100 = 16.67%."
  },

  // --- PROFIT AND LOSS ---
  {
    id: 3017,
    question_text: "A trader sells an article for Rs. 720 making a profit of 20%. What was the cost price of the article?",
    option_a: "Rs. 576",
    option_b: "Rs. 600",
    option_c: "Rs. 640",
    option_d: "Rs. 680",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Cost Price = SP / (1 + Profit%) = 720 / 1.20 = Rs. 600."
  },
  {
    id: 3018,
    question_text: "A shopkeeper marks an item 30% above the cost price and allows a discount of 10%. What is his net profit percentage?",
    option_a: "17%",
    option_b: "18%",
    option_c: "20%",
    option_d: "23%",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Let CP = 100. Marked Price = 130. SP = 130 * 0.90 = 117. Net profit % = 17%."
  },
  {
    id: 3019,
    question_text: "By selling 12 articles for Rs. 60, a man loses 20%. How many articles should he sell for Rs. 60 to make a profit of 20%?",
    option_a: "6",
    option_b: "8",
    option_c: "9",
    option_d: "10",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "SP per article = 60/12 = Rs. 5. Loss is 20%, so CP per article = 5 / 0.8 = Rs. 6.25. Desired SP per article = 6.25 * 1.2 = Rs. 7.50. Number of articles for Rs. 60 = 60 / 7.50 = 8."
  },
  {
    id: 3020,
    question_text: "If the cost price of 15 apples is equal to the selling price of 12 apples, what is the profit percentage?",
    option_a: "20%",
    option_b: "25%",
    option_c: "30%",
    option_d: "33.33%",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "15 * CP = 12 * SP => SP/CP = 15/12 = 5/4. Profit% = ((5 - 4) / 4) * 100 = 25%."
  },

  // --- RATIO AND PROPORTION ---
  {
    id: 3021,
    question_text: "If A:B = 2:3 and B:C = 4:5, find the ratio A:B:C.",
    option_a: "8:12:15",
    option_b: "6:9:15",
    option_c: "8:10:15",
    option_d: "2:4:5",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Multiply A:B by 4 -> 8:12. Multiply B:C by 3 -> 12:15. Combining gives A:B:C = 8:12:15."
  },
  {
    id: 3022,
    question_text: "Two numbers are in the ratio 3:5. If 9 is subtracted from each, the new numbers are in the ratio 12:23. What is the smaller number?",
    option_a: "27",
    option_b: "33",
    option_c: "45",
    option_d: "55",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Let numbers be 3x and 5x. (3x - 9)/(5x - 9) = 12/23 => 23(3x - 9) = 12(5x - 9) => 69x - 207 = 60x - 108 => 9x = 99 => x = 11. Smaller number = 3 * 11 = 33."
  },
  {
    id: 3023,
    question_text: "A sum of Rs. 430 is divided among A, B, and C such that A gets 45% of the total and B and C share the remainder in ratio 3:2. How much does C get?",
    option_a: "Rs. 94.60",
    option_b: "Rs. 141.90",
    option_c: "Rs. 193.50",
    option_d: "Rs. 236.50",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "A gets 45% of 430 = 193.5. Remainder = 430 - 193.5 = 236.5. C gets (2/5) * 236.5 = Rs. 94.60."
  },
  {
    id: 3024,
    question_text: "The ratio of monthly incomes of A and B is 4:3, and their monthly expenditures are in ratio 3:2. If each saves Rs. 6,000 per month, what is A's monthly income?",
    option_a: "Rs. 18,000",
    option_b: "Rs. 24,000",
    option_c: "Rs. 30,000",
    option_d: "Rs. 36,000",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Let incomes be 4x, 3x and expenditures 3y, 2y. 4x - 3y = 6000 and 3x - 2y = 6000. Subtracting equations gives x = 6000. A's income = 4 * 6000 = Rs. 24,000."
  },

  // --- AVERAGES ---
  {
    id: 3025,
    question_text: "The average score of 5 students in a test is 80. If a 6th student scores 92, what is the new average score of the class?",
    option_a: "81.5",
    option_b: "82",
    option_c: "83.5",
    option_d: "84",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Total initial score = 5 * 80 = 400. New total = 400 + 92 = 492. New average = 492 / 6 = 82."
  },
  {
    id: 3026,
    question_text: "The average age of a family of 4 members is 28 years. If the age of the youngest member is 8 years, what was the average age of the family 8 years ago?",
    option_a: "20 years",
    option_b: "24.67 years",
    option_c: "26.67 years",
    option_d: "28 years",
    correct_option: "C",
    difficulty: "Hard",
    explanation: "Current total age = 4 * 28 = 112 years. 8 years ago, sum of ages of 3 remaining members = 112 - (4 * 8) = 80 years. Average age of 3 members 8 years ago = 80 / 3 = 26.67 years."
  },
  {
    id: 3027,
    question_text: "The average weight of 8 persons increases by 2.5 kg when a new person comes in place of one weighing 65 kg. What is the weight of the new person?",
    option_a: "75 kg",
    option_b: "80 kg",
    option_c: "85 kg",
    option_d: "90 kg",
    correct_option: "C",
    difficulty: "Hard",
    explanation: "Total increase in weight = 8 * 2.5 = 20 kg. Weight of new person = 65 + 20 = 85 kg."
  },
  {
    id: 3028,
    question_text: "The average of 10 numbers is 15. If each number is multiplied by 3 and then increased by 5, what is the new average?",
    option_a: "45",
    option_b: "50",
    option_c: "55",
    option_d: "60",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Applying linear operations to all numbers applies identically to their average: New average = (15 * 3) + 5 = 50."
  },
  {
    id: 3029,
    question_text: "In a class of 50 students, 40% are girls. The average weight of boys is 60 kg and that of girls is 50 kg. What is the average weight of the whole class?",
    option_a: "54 kg",
    option_b: "55 kg",
    option_c: "56 kg",
    option_d: "57 kg",
    correct_option: "C",
    difficulty: "Hard",
    explanation: "Girls = 40% of 50 = 20. Boys = 30. Total weight = (30 * 60) + (20 * 50) = 1800 + 1000 = 2800 kg. Class average = 2800 / 50 = 56 kg."
  },

  // --- TIME AND WORK ---
  {
    id: 3030,
    question_text: "A can complete a work in 10 days and B can complete the same work in 15 days. How many days will they take working together?",
    option_a: "5 days",
    option_b: "6 days",
    option_c: "7.5 days",
    option_d: "8 days",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Combined rate = 1/10 + 1/15 = 5/30 = 1/6 work per day. Total time = 6 days."
  },
  {
    id: 3031,
    question_text: "A and B together can do a piece of work in 12 days. B alone can finish it in 30 days. In how many days can A alone finish the work?",
    option_a: "18 days",
    option_b: "20 days",
    option_c: "24 days",
    option_d: "25 days",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "A's rate = 1/12 - 1/30 = (5 - 2)/60 = 3/60 = 1/20 work per day. A takes 20 days."
  },
  {
    id: 3032,
    question_text: "A is twice as efficient as B. If together they finish a job in 14 days, in how many days can A alone finish the job?",
    option_a: "21 days",
    option_b: "28 days",
    option_c: "35 days",
    option_d: "42 days",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Efficiency ratio A:B = 2:1. Total work units = (2 + 1) * 14 = 42 units. A's time = 42 / 2 = 21 days."
  },

  // --- TIME, SPEED AND DISTANCE ---
  {
    id: 3033,
    question_text: "A train 150 meters long passes a telegraph pole in 10 seconds. What is the speed of the train in km/h?",
    option_a: "45 km/h",
    option_b: "54 km/h",
    option_c: "60 km/h",
    option_d: "72 km/h",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Speed in m/s = 150 / 10 = 15 m/s. Convert to km/h: 15 * (18 / 5) = 54 km/h."
  },
  {
    id: 3034,
    question_text: "A car covers a distance of 300 km at a uniform speed. If speed was 10 km/h more, it would take 1 hour less. What was original speed?",
    option_a: "40 km/h",
    option_b: "50 km/h",
    option_c: "60 km/h",
    option_d: "75 km/h",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "300/v - 300/(v+10) = 1. Testing v = 50: 300/50 - 300/60 = 6 - 5 = 1 hour. Original speed = 50 km/h."
  },
  {
    id: 3035,
    question_text: "Two trains running in opposite directions at 60 km/h and 40 km/h cross each other in 18 seconds. If one train is 260 m long, find the length of the second train.",
    option_a: "240 m",
    option_b: "250 m",
    option_c: "260 m",
    option_d: "300 m",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Relative speed = 60 + 40 = 100 km/h = 100 * (5/18) = 250/9 m/s. Total distance = (250/9) * 18 = 500 m. Second train length = 500 - 260 = 240 m."
  },
  {
    id: 3036,
    question_text: "A man travels from city A to city B at 40 km/h and returns at 60 km/h. What is his average speed for the entire journey?",
    option_a: "48 km/h",
    option_b: "50 km/h",
    option_c: "52 km/h",
    option_d: "54 km/h",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Average speed for equal distances = 2xy / (x + y) = (2 * 40 * 60) / (40 + 60) = 4800 / 100 = 48 km/h."
  },

  // --- SIMPLE INTEREST ---
  {
    id: 3037,
    question_text: "What simple interest will Rs. 5,000 earn at 8% per annum in 3 years?",
    option_a: "Rs. 1,000",
    option_b: "Rs. 1,200",
    option_c: "Rs. 1,400",
    option_d: "Rs. 1,500",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "SI = (P * R * T) / 100 = (5000 * 8 * 3) / 100 = Rs. 1,200."
  },
  {
    id: 3038,
    question_text: "A sum of money doubles itself in 8 years at simple interest. What is the rate of interest per annum?",
    option_a: "10%",
    option_b: "12.5%",
    option_c: "15%",
    option_d: "16.67%",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "If sum doubles, SI = P. P = (P * R * 8) / 100 => R = 100 / 8 = 12.5% per annum."
  },
  {
    id: 3039,
    question_text: "At what rate of simple interest per annum will Rs. 8,000 amount to Rs. 10,400 in 3 years?",
    option_a: "8%",
    option_b: "9%",
    option_c: "10%",
    option_d: "12%",
    correct_option: "C",
    difficulty: "Hard",
    explanation: "SI = 10,400 - 8,000 = Rs. 2,400. R = (2400 * 100) / (8000 * 3) = 10% per annum."
  },

  // --- COMPOUND INTEREST ---
  {
    id: 3040,
    question_text: "Find the compound interest on Rs. 10,000 at 10% per annum for 2 years compounded annually.",
    option_a: "Rs. 2,000",
    option_b: "Rs. 2,100",
    option_c: "Rs. 2,200",
    option_d: "Rs. 2,500",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Amount = 10000 * (1.10)^2 = 12100. CI = 12100 - 10000 = Rs. 2,100."
  },
  {
    id: 3041,
    question_text: "The difference between CI and SI on a certain sum at 10% per annum for 2 years is Rs. 50. What is the principal sum?",
    option_a: "Rs. 4,000",
    option_b: "Rs. 5,000",
    option_c: "Rs. 6,000",
    option_d: "Rs. 7,500",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Difference for 2 years = P * (R/100)^2 => 50 = P * (10/100)^2 => 50 = 0.01P => P = Rs. 5,000."
  },
  {
    id: 3042,
    question_text: "A sum of money compounded annually becomes 1.44 times of itself in 2 years. What is the rate of interest per annum?",
    option_a: "15%",
    option_b: "20%",
    option_c: "22%",
    option_d: "25%",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "(1 + R/100)^2 = 1.44 => 1 + R/100 = 1.2 => R/100 = 0.20 => R = 20%."
  },
  {
    id: 3043,
    question_text: "Find the compound interest on Rs. 8,000 for 1 year at 10% per annum, compounded half-yearly.",
    option_a: "Rs. 820",
    option_b: "Rs. 840",
    option_c: "Rs. 860",
    option_d: "Rs. 880",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Half-yearly rate = 5%, n = 2. Amount = 8000 * (1.05)^2 = 8820. CI = 8820 - 8000 = Rs. 820."
  },
  {
    id: 3044,
    question_text: "If a principal becomes 8 times itself in 3 years under compound interest, in how many years will it become 16 times itself?",
    option_a: "4 years",
    option_b: "5 years",
    option_c: "6 years",
    option_d: "8 years",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "P(1+r)^3 = 8P => (1+r)^3 = 2^3 => (1+r) = 2. For 16P: (1+r)^t = 2^t = 16 = 2^4 => t = 4 years."
  },

  // --- PROBABILITY ---
  {
    id: 3045,
    question_text: "Two fair dice are thrown simultaneously. What is the probability of getting a sum of 8?",
    option_a: "1/6",
    option_b: "5/36",
    option_c: "1/9",
    option_d: "7/36",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Favorable outcomes for sum=8: (2,6), (3,5), (4,4), (5,3), (6,2) -> 5 outcomes out of 36 total. Probability = 5/36."
  },
  {
    id: 3046,
    question_text: "A card is drawn at random from a standard deck of 52 cards. What is the probability that it is either a King or a Heart?",
    option_a: "4/13",
    option_b: "16/52",
    option_c: "9/26",
    option_d: "17/52",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "P(King or Heart) = P(King) + P(Heart) - P(King of Hearts) = (4/52) + (13/52) - (1/52) = 16/52 = 4/13."
  },
  {
    id: 3047,
    question_text: "A bag contains 4 red balls and 6 blue balls. If 2 balls are drawn at random without replacement, what is probability both are red?",
    option_a: "2/15",
    option_b: "4/25",
    option_c: "2/9",
    option_d: "1/3",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "P(both red) = (4/10) * (3/9) = 12/90 = 2/15."
  },
  {
    id: 3048,
    question_text: "Three unbiased coins are tossed together. What is the probability of getting at least two heads?",
    option_a: "1/4",
    option_b: "3/8",
    option_c: "1/2",
    option_d: "5/8",
    correct_option: "C",
    difficulty: "Hard",
    explanation: "Favorable outcomes (HHH, HHT, HTH, THH) = 4 out of 8 total outcomes = 4/8 = 1/2."
  },

  // --- PERMUTATION AND COMBINATION ---
  {
    id: 3049,
    question_text: "In how many different ways can the letters of the word 'LEADER' be arranged?",
    option_a: "120",
    option_b: "360",
    option_c: "720",
    option_d: "1440",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Word 'LEADER' has 6 letters with 'E' repeating 2 times. Total arrangements = 6! / 2! = 720 / 2 = 360."
  },
  {
    id: 3050,
    question_text: "In how many ways can a committee of 3 men and 2 women be formed from a group of 5 men and 4 women?",
    option_a: "40",
    option_b: "60",
    option_c: "80",
    option_d: "120",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Ways = C(5, 3) * C(4, 2) = 10 * 6 = 60 ways."
  },
  {
    id: 3051,
    question_text: "How many 3-digit numbers can be formed using the digits 1, 2, 3, 4, 5 without repetition?",
    option_a: "20",
    option_b: "60",
    option_c: "120",
    option_d: "125",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Number of ways = P(5, 3) = 5 * 4 * 3 = 60."
  },

  // --- DATA INTERPRETATION ---
  {
    id: 3052,
    question_text: "A company's quarterly sales (in Lakhs) are Q1: 100, Q2: 150, Q3: 200, Q4: 350. What is the percentage contribution of Q3 to total annual sales?",
    option_a: "20%",
    option_b: "25%",
    option_c: "27.27%",
    option_d: "30%",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Total sales = 100 + 150 + 200 + 350 = 800 Lakhs. Q3 % = (200 / 800) * 100 = 25%."
  },
  {
    id: 3053,
    question_text: "In a pie chart representing student enrollment across 4 departments (CS: 30%, EC: 25%, ME: 20%, Civil: 25%), what is the central angle for the CS department?",
    option_a: "90°",
    option_b: "108°",
    option_c: "120°",
    option_d: "135°",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Central angle = 30% of 360° = 0.30 * 360° = 108°."
  },
  {
    id: 3054,
    question_text: "Production of Item X over 3 years: 2021: 400 units, 2022: 500 units, 2023: 650 units. What is the percentage increase in production from 2021 to 2023?",
    option_a: "50%",
    option_b: "62.5%",
    option_c: "65%",
    option_d: "75%",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Percentage increase = ((650 - 400) / 400) * 100 = (250 / 400) * 100 = 62.5%."
  },
  {
    id: 3055,
    question_text: "The ratio of expenditure to savings of a family is 7:3. If the total monthly income is Rs. 50,000, how much does the family save per month?",
    option_a: "Rs. 12,000",
    option_b: "Rs. 15,000",
    option_c: "Rs. 20,000",
    option_d: "Rs. 35,000",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Total parts = 7 + 3 = 10. Monthly savings = (3 / 10) * 50,000 = Rs. 15,000."
  },

  // --- LOGICAL REASONING: CODING-DECODING ---
  {
    id: 3056,
    question_text: "If 'COMPUTER' is coded as 'RFUVQNPC', how is 'MEDICINE' coded in that system?",
    option_a: "EOJDJEFM",
    option_b: "EOJDEJFM",
    option_c: "MFEJDJOE",
    option_d: "MFEDJJOE",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Reverse word letters and shift intermediate letters +1: C...R becomes R...C with internal letters shifted +1."
  },
  {
    id: 3057,
    question_text: "In a code language: '3a 2b 7c' means 'Truth is Eternal', '7c 9d 8e' means 'Eternal Life Calls', and '3a 4f' means 'Truth Prevails'. What is the code for 'is'?",
    option_a: "3a",
    option_b: "2b",
    option_c: "7c",
    option_d: "9d",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "3a = Truth, 7c = Eternal. Therefore, 2b = is."
  },
  {
    id: 3058,
    question_text: "If CLOCK is coded as 31215311, how is WATCH coded in the same positional system?",
    option_a: "2312038",
    option_b: "23120138",
    option_c: "2212038",
    option_d: "2311938",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Alphabetical positions: W=23, A=1, T=20, C=3, H=8 => 2312038."
  },

  // --- BLOOD RELATIONS ---
  {
    id: 3059,
    question_text: "Pointing to a photograph of a man, Rahul said, 'His mother is the only daughter of my mother-in-law.' How is Rahul related to the man?",
    option_a: "Uncle",
    option_b: "Father",
    option_c: "Brother",
    option_d: "Son",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Only daughter of Rahul's mother-in-law is Rahul's wife. The man's mother is Rahul's wife => Rahul is his father."
  },
  {
    id: 3060,
    question_text: "If A + B means A is brother of B; A - B means A is sister of B; A * B means A is father of B. Which expression means M is the uncle of N?",
    option_a: "M + P * N",
    option_b: "M * P + N",
    option_c: "M - P * N",
    option_d: "M * P - N",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "M + P means M is brother of P. P * N means P is father of N. So M is the paternal uncle of N."
  },
  {
    id: 3061,
    question_text: "Introducing a woman, a man said, 'Her husband is the only son of my father.' How is the woman related to the man?",
    option_a: "Sister",
    option_b: "Wife",
    option_c: "Mother",
    option_d: "Daughter",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Only son of the man's father is the man himself. Woman's husband is the man himself => she is his wife."
  },

  // --- DIRECTION SENSE ---
  {
    id: 3062,
    question_text: "A man walks 6 km North, turns Right and walks 8 km. How far and in which direction is he from his starting point?",
    option_a: "10 km North-East",
    option_b: "10 km South-East",
    option_c: "14 km North-East",
    option_d: "12 km East",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Displacement = sqrt(6^2 + 8^2) = sqrt(36 + 64) = sqrt(100) = 10 km in North-East direction."
  },
  {
    id: 3063,
    question_text: "A person walks 5 m West, turns Left and walks 12 m. What is the shortest distance to his starting point?",
    option_a: "13 m",
    option_b: "15 m",
    option_c: "17 m",
    option_d: "7 m",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Shortest distance = sqrt(5^2 + 12^2) = sqrt(25 + 144) = sqrt(169) = 13 m."
  },
  {
    id: 3064,
    question_text: "At 3:00 PM, the minute hand of a clock points North. In which direction does the hour hand point?",
    option_a: "North",
    option_b: "East",
    option_c: "South",
    option_d: "West",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "At 3:00 PM, the minute hand is at 12 (North) and hour hand is at 3 (90 degrees clockwise = East)."
  },
  {
    id: 3065,
    question_text: "Rohan walks 10 km South, then 6 km North, then 3 km East. How far is he from his starting point?",
    option_a: "5 km",
    option_b: "7 km",
    option_c: "9 km",
    option_d: "11 km",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Net South displacement = 10 - 6 = 4 km. Net East displacement = 3 km. Distance = sqrt(4^2 + 3^2) = 5 km."
  },

  // --- SYLLOGISM ---
  {
    id: 3066,
    question_text: "Statements: (1) All cats are dogs. (2) All dogs are birds. Conclusions: I. All cats are birds. II. Some birds are cats.",
    option_a: "Only conclusion I follows",
    option_b: "Only conclusion II follows",
    option_c: "Either I or II follows",
    option_d: "Both I and II follow",
    correct_option: "D",
    difficulty: "Hard",
    explanation: "Since Cats subset Dogs subset Birds, All cats are birds (I) and Some birds are cats (II) both logically follow."
  },
  {
    id: 3067,
    question_text: "Statements: (1) Some books are pens. (2) No pen is a pencil. Conclusions: I. Some books are not pencils. II. No book is a pencil.",
    option_a: "Only conclusion I follows",
    option_b: "Only conclusion II follows",
    option_c: "Neither I nor II follows",
    option_d: "Both I and II follow",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "The books that are pens cannot be pencils, so 'Some books are not pencils' is true. Conclusion II is not necessarily true."
  },
  {
    id: 3068,
    question_text: "Statements: (1) All cars are vehicles. (2) Some vehicles are electric. Conclusions: I. All cars are electric. II. Some cars are not electric.",
    option_a: "Only I follows",
    option_b: "Only II follows",
    option_c: "Either I or II follows",
    option_d: "Neither I nor II follows",
    correct_option: "D",
    difficulty: "Hard",
    explanation: "No definite relationship between Cars and Electric is established by the premises."
  },
  {
    id: 3069,
    question_text: "Statements: (1) No apple is a mango. (2) No mango is a banana. Conclusions: I. No apple is a banana. II. Some bananas are apples.",
    option_a: "Only I follows",
    option_b: "Only II follows",
    option_c: "Either I or II follows",
    option_d: "Neither I nor II follows",
    correct_option: "D",
    difficulty: "Hard",
    explanation: "No conclusion can be drawn between apples and bananas from two negative premises."
  },

  // --- SEATING ARRANGEMENT ---
  {
    id: 3070,
    question_text: "Five friends A, B, C, D, E sit in a row facing North. A is to the immediate left of B and right of C. D is right of E and left of C. Who is in the middle?",
    option_a: "A",
    option_b: "B",
    option_c: "C",
    option_d: "D",
    correct_option: "C",
    difficulty: "Hard",
    explanation: "Position sequence from left to right: E, D, C, A, B. C is sitting in the middle."
  },
  {
    id: 3071,
    question_text: "Six people P, Q, R, S, T, U sit around a circle facing center. P is opposite S. Q is between P and R. T is between S and U. Who sits opposite Q?",
    option_a: "R",
    option_b: "S",
    option_c: "T",
    option_d: "U",
    correct_option: "C",
    difficulty: "Hard",
    explanation: "Circular arrangement: P-Q-R-S-T-U. Opposite pairs: (P,S), (Q,T), (R,U). Opposite Q is T."
  },
  {
    id: 3072,
    question_text: "In a row facing North, X is 3rd to the left of Y, and Z is 2nd to the right of X. What is Z's position relative to Y?",
    option_a: "Immediate left of Y",
    option_b: "Immediate right of Y",
    option_c: "2nd to left of Y",
    option_d: "2nd to right of Y",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Sequence: X, _, Z, Y. Therefore Z is immediately to the left of Y."
  },
  {
    id: 3073,
    question_text: "Four boys A, B, C, D and four girls E, F, G, H sit around a circle facing center alternating boy-girl. How many boys sit adjacent to E?",
    option_a: "0",
    option_b: "1",
    option_c: "2",
    option_d: "4",
    correct_option: "C",
    difficulty: "Hard",
    explanation: "In an alternating circular seating arrangement, every girl is flanked by exactly 2 boys."
  },

  // --- ANALOGY ---
  {
    id: 3074,
    question_text: "Select the related number: 7 : 50 :: 9 : ?",
    option_a: "64",
    option_b: "80",
    option_c: "82",
    option_d: "90",
    correct_option: "C",
    difficulty: "Hard",
    explanation: "Pattern: n^2 + 1. 7^2 + 1 = 50 => 9^2 + 1 = 82."
  },
  {
    id: 3075,
    question_text: "Select the related letter-group: BCD : EFG :: LMN : ?",
    option_a: "OPQ",
    option_b: "OPR",
    option_c: "NOP",
    option_d: "PQR",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Shift each letter by +3 position: B+3=E, C+3=F, D+3=G => L+3=O, M+3=P, N+3=Q (OPQ)."
  },
  {
    id: 3076,
    question_text: "Select the related pair: 11 : 132 :: 13 : ?",
    option_a: "169",
    option_b: "182",
    option_c: "195",
    option_d: "210",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Pattern: n * (n + 1). 11 * 12 = 132 => 13 * 14 = 182."
  },
  {
    id: 3077,
    question_text: "Select the related letter-group: ACE : GIK :: MOQ : ?",
    option_a: "SUW",
    option_b: "RTV",
    option_c: "TVX",
    option_d: "UWY",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Shift each letter by +6 positions: A+6=G, C+6=I, E+6=K => M+6=S, O+6=U, Q+6=W (SUW)."
  },

  // --- CLASSIFICATION ---
  {
    id: 3078,
    question_text: "Find the odd number pair out: (12, 144), (15, 225), (18, 324), (14, 200).",
    option_a: "(12, 144)",
    option_b: "(15, 225)",
    option_c: "(18, 324)",
    option_d: "(14, 200)",
    correct_option: "D",
    difficulty: "Hard",
    explanation: "14 squared is 196, whereas (14, 200) lists 200. All other pairs are exact squares n:n^2."
  },
  {
    id: 3079,
    question_text: "Find the odd letter-group out: PRT, TVX, LNP, HKL.",
    option_a: "PRT",
    option_b: "TVX",
    option_c: "LNP",
    option_d: "HKL",
    correct_option: "D",
    difficulty: "Hard",
    explanation: "PRT, TVX, LNP all increase by +2 letters. HKL increases by +3, +1, so it is the odd one."
  },
  {
    id: 3080,
    question_text: "Find the odd number out: 27, 64, 125, 144.",
    option_a: "27",
    option_b: "64",
    option_c: "125",
    option_d: "144",
    correct_option: "D",
    difficulty: "Hard",
    explanation: "27=3^3, 64=4^3, 125=5^3 are perfect cubes. 144=12^2 is a square, not a cube."
  },
  {
    id: 3081,
    question_text: "Find the odd word out: Meter, Yard, Mile, Acre.",
    option_a: "Meter",
    option_b: "Yard",
    option_c: "Mile",
    option_d: "Acre",
    correct_option: "D",
    difficulty: "Hard",
    explanation: "Meter, Yard, and Mile are units of length/distance. Acre is a unit of area."
  },

  // --- LOGICAL SEQUENCE ---
  {
    id: 3082,
    question_text: "Arrange the words in a logical order: (1) Seed, (2) Plant, (3) Tree, (4) Fruit, (5) Flower.",
    option_a: "1, 2, 3, 5, 4",
    option_b: "1, 2, 3, 4, 5",
    option_c: "2, 1, 3, 5, 4",
    option_d: "1, 3, 2, 5, 4",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Logical sequence: Seed -> Plant -> Tree -> Flower -> Fruit (1, 2, 3, 5, 4)."
  },
  {
    id: 3083,
    question_text: "Arrange in logical order: (1) Doctor, (2) Fever, (3) Prescribe, (4) Medicine, (5) Recovery.",
    option_a: "2, 1, 3, 4, 5",
    option_b: "1, 2, 3, 4, 5",
    option_c: "2, 3, 1, 4, 5",
    option_d: "2, 1, 4, 3, 5",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Logical sequence: Fever -> Doctor -> Prescribe -> Medicine -> Recovery (2, 1, 3, 4, 5)."
  },
  {
    id: 3084,
    question_text: "In a class rank list, Suresh is 7th from the top and 28th from the bottom. How many students are in the class?",
    option_a: "34",
    option_b: "35",
    option_c: "36",
    option_d: "37",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Total students = Rank from top + Rank from bottom - 1 = 7 + 28 - 1 = 34."
  },
  {
    id: 3085,
    question_text: "Arrange software lifecycle steps: (1) Testing, (2) Coding, (3) Requirements, (4) Deployment, (5) Design.",
    option_a: "3, 5, 2, 1, 4",
    option_b: "3, 2, 5, 1, 4",
    option_c: "5, 3, 2, 1, 4",
    option_d: "3, 5, 1, 2, 4",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "Logical order: Requirements -> Design -> Coding -> Testing -> Deployment (3, 5, 2, 1, 4)."
  },

  // --- VOCABULARY ---
  {
    id: 3086,
    question_text: "Choose the word that best completes the sentence: 'The speaker\\'s ________ argument convinced even the most skeptical members of the committee.'",
    option_a: "ambiguous",
    option_b: "cogent",
    option_c: "superficial",
    option_d: "redundant",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "'Cogent' means clear, logical, and convincing."
  },
  {
    id: 3087,
    question_text: "Select the word most OPPOSITE in meaning to 'EPHEMERAL':",
    option_a: "Transient",
    option_b: "Permanent",
    option_c: "Fleeting",
    option_d: "Evanescent",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "'Ephemeral' means lasting for a very short time; 'Permanent' is its antonym."
  },
  {
    id: 3088,
    question_text: "What is the meaning of the idiom 'To burn the candle at both ends'?",
    option_a: "To waste energy unnecessarily",
    option_b: "To work late into the night and early in the morning",
    option_c: "To cause a fire hazard",
    option_d: "To live an extravagant lifestyle",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "'Burn the candle at both ends' means to exhaust oneself by working early and late."
  },
  {
    id: 3089,
    question_text: "Choose the correct meaning of the word 'PRAGMATIC':",
    option_a: "Dealing with things sensibly and realistically",
    option_b: "Overly theoretical and speculative",
    option_c: "Rigidly dogmatic",
    option_d: "Careless and reckless",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "'Pragmatic' means guided by practical considerations rather than theory."
  },
  {
    id: 3090,
    question_text: "Select the word that replaces the phrase: 'Showing favor to relatives in official appointments.'",
    option_a: "Despotism",
    option_b: "Nepotism",
    option_c: "Bureaucracy",
    option_d: "Chauvinism",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "'Nepotism' refers to patronage bestowed or favoritism shown to relatives."
  },

  // --- SYNONYMS AND ANTONYMS ---
  {
    id: 3091,
    question_text: "Choose the closest SYNONYM for 'METICULOUS':",
    option_a: "Careless",
    option_b: "Painstaking",
    option_c: "Hasty",
    option_d: "Sloppy",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "'Meticulous' means showing extreme care and attention to detail; painstaking."
  },
  {
    id: 3092,
    question_text: "Choose the closest ANTONYM for 'CANDID':",
    option_a: "Frank",
    option_b: "Outspoken",
    option_c: "Deceitful",
    option_d: "Honest",
    correct_option: "C",
    difficulty: "Hard",
    explanation: "'Candid' means truthful and straightforward; 'Deceitful' is its antonym."
  },
  {
    id: 3093,
    question_text: "Choose the closest SYNONYM for 'BENEVOLENT':",
    option_a: "Malevolent",
    option_b: "Compassionate",
    option_c: "Miserly",
    option_d: "Hostile",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "'Benevolent' means well-meaning and kindly; compassionate."
  },
  {
    id: 3094,
    question_text: "Choose the closest ANTONYM for 'AUDACIOUS':",
    option_a: "Bold",
    option_b: "Timid",
    option_c: "Courageous",
    option_d: "Reckless",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "'Audacious' means showing a willingness to take bold risks; 'Timid' is its opposite."
  },
  {
    id: 3095,
    question_text: "Choose the closest SYNONYM for 'LUCID':",
    option_a: "Obscure",
    option_b: "Clear",
    option_c: "Ambiguous",
    option_d: "Vague",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "'Lucid' means expressed clearly; easy to understand."
  },

  // --- SENTENCE CORRECTION ---
  {
    id: 3096,
    question_text: "Select the option that best replaces the underlined phrase: 'Neither the manager nor the employees was present at the conference.'",
    option_a: "was present",
    option_b: "were present",
    option_c: "is present",
    option_d: "have present",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "With 'neither... nor', the verb agrees with the subject closer to it ('employees' -> plural 'were present')."
  },
  {
    id: 3097,
    question_text: "Correct the sentence: 'Hardly had I reached the station than the train left.'",
    option_a: "than the train left",
    option_b: "when the train left",
    option_c: "then the train left",
    option_d: "after the train left",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "'Hardly... when' is the correct correlative conjunction pair."
  },
  {
    id: 3098,
    question_text: "Select the grammatically correct sentence:",
    option_a: "One of the student have submitted their project.",
    option_b: "One of the students has submitted his project.",
    option_c: "One of the students have submitted his project.",
    option_d: "One of the student has submit their project.",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "'One of the [plural noun]' takes a singular verb ('has submitted')."
  },

  // --- ERROR DETECTION ---
  {
    id: 3099,
    question_text: "Find the error part: '(A) Each of the candidates / (B) were interviewed / (C) by the panel / (D) yesterday.'",
    option_a: "(A)",
    option_b: "(B)",
    option_c: "(C)",
    option_d: "(D)",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "'Each' takes a singular verb. Part (B) should be 'was interviewed'."
  },
  {
    id: 3100,
    question_text: "Find the error part: '(A) The price of / (B) all essential commodities / (C) have increased / (D) sharply this month.'",
    option_a: "(A)",
    option_b: "(B)",
    option_c: "(C)",
    option_d: "(D)",
    correct_option: "C",
    difficulty: "Hard",
    explanation: "The subject 'The price' is singular; part (C) should be 'has increased'."
  },
  {
    id: 3101,
    question_text: "Find the error part: '(A) He is senior / (B) than me / (C) in service / (D) by two years.'",
    option_a: "(A)",
    option_b: "(B)",
    option_c: "(C)",
    option_d: "(D)",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Adjectives like 'senior', 'junior' take the preposition 'to' instead of 'than'. Part (B) should be 'to me'."
  },

  // --- GRAMMAR ---
  {
    id: 3102,
    question_text: "Identify the correct passive voice of: 'The chef prepared a delicious dinner.'",
    option_a: "A delicious dinner is prepared by the chef.",
    option_b: "A delicious dinner was prepared by the chef.",
    option_c: "A delicious dinner has been prepared by the chef.",
    option_d: "A delicious dinner had prepared by the chef.",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Past simple active ('prepared') converts to past simple passive ('was prepared')."
  },
  {
    id: 3103,
    question_text: "Choose the correct indirect speech form of: He said, 'I am going to the market.'",
    option_a: "He said that he is going to the market.",
    option_b: "He said that he was going to the market.",
    option_c: "He said that I was going to the market.",
    option_d: "He says that he was going to the market.",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Direct present continuous 'am going' changes to past continuous 'was going'."
  },
  {
    id: 3104,
    question_text: "Fill in the blank: 'If it rains tomorrow, we ________ the match.'",
    option_a: "would cancel",
    option_b: "will cancel",
    option_c: "cancelled",
    option_d: "had cancelled",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "First conditional rule: If + Present Simple, Will + Verb."
  },
  {
    id: 3105,
    question_text: "Choose the correct preposition: 'She has been living in this city ________ 2018.'",
    option_a: "for",
    option_b: "since",
    option_c: "from",
    option_d: "in",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "'Since' indicates a specific starting point in time."
  },
  {
    id: 3106,
    question_text: "Identify the sentence with proper subject-verb agreement:",
    option_a: "The committee have decided its verdict.",
    option_b: "The committee has decided its verdict.",
    option_c: "The committee are deciding its verdict.",
    option_d: "The committee have decide its verdict.",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "Collective noun 'committee' acting as a unified entity takes singular verb 'has'."
  },

  // --- FILL IN THE BLANKS ---
  {
    id: 3107,
    question_text: "Fill in the blanks: 'The team worked ________ to meet the tight deadline, despite facing ________ obstacles.'",
    option_a: "sluggishly ... minor",
    option_b: "tirelessly ... numerous",
    option_c: "carelessly ... zero",
    option_d: "casually ... severe",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "'Tirelessly' and 'numerous' logically fit the contrast implied by 'despite'."
  },
  {
    id: 3108,
    question_text: "Fill in the blanks: 'Although the quarterly results were ________, the manager remained ________ about future growth.'",
    option_a: "disappointing ... optimistic",
    option_b: "encouraging ... pessimistic",
    option_c: "outstanding ... hopeless",
    option_d: "conclusive ... indifferent",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "'Although' introduces a contrast between disappointing results and an optimistic outlook."
  },
  {
    id: 3109,
    question_text: "Choose the correct preposition: 'She is very keen ________ mastering artificial intelligence techniques.'",
    option_a: "on",
    option_b: "at",
    option_c: "in",
    option_d: "for",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "The adjective 'keen' takes the preposition 'on'."
  },
  {
    id: 3110,
    question_text: "Fill in the blank: 'The company\\'s revenue increased by 20% ________ higher demand during the festive season.'",
    option_a: "due to",
    option_b: "in spite of",
    option_c: "instead of",
    option_d: "regardless of",
    correct_option: "A",
    difficulty: "Hard",
    explanation: "'Due to' correctly indicates the cause of the revenue increase."
  },

  // --- READING COMPREHENSION ---
  {
    id: 3111,
    question_text: "Passage: 'Artificial Intelligence (AI) is transforming healthcare by analyzing vast medical datasets to detect diseases earlier than traditional methods. However, concerns regarding data privacy and algorithmic bias remain significant challenges.' What is the main idea?",
    option_a: "The history of medical technology",
    option_b: "Benefits and challenges of AI in healthcare",
    option_c: "How to eliminate data privacy concerns",
    option_d: "Traditional vs modern medical diagnostics",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "The passage summarizes both the diagnostic benefits and challenges of AI in healthcare."
  },
  {
    id: 3112,
    question_text: "Based on the passage, what is identified as a major challenge for AI in healthcare?",
    option_a: "High cost of equipment",
    option_b: "Algorithmic bias and data privacy",
    option_c: "Lack of medical datasets",
    option_d: "Resistance from doctors",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "The passage explicitly mentions data privacy and algorithmic bias as key challenges."
  },
  {
    id: 3113,
    question_text: "What can be inferred from the passage regarding traditional medical methods?",
    option_a: "They are completely obsolete.",
    option_b: "They may detect diseases later compared to AI analysis of vast datasets.",
    option_c: "They do not involve data privacy concerns.",
    option_d: "They are faster than AI.",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "The passage states AI detects diseases 'earlier than traditional methods', inferring traditional methods detect them later."
  },
  {
    id: 3114,
    question_text: "What is the tone of the author in the passage?",
    option_a: "Highly critical and hostile",
    option_b: "Balanced and informative",
    option_c: "Overly enthusiastic and biased",
    option_d: "Dismissive and indifferent",
    correct_option: "B",
    difficulty: "Hard",
    explanation: "The author presents both advantages and challenges in an objective, informative manner."
  }
];

async function updateAptitudeBank() {
  console.log(`Starting update of ${replacements.length} aptitude questions...`);

  let updated = 0;
  for (const item of replacements) {
    const [result] = await db.promise().query(
      `UPDATE aptitude_practice_questions
       SET question_text = ?,
           option_a = ?,
           option_b = ?,
           option_c = ?,
           option_d = ?,
           correct_option = ?,
           difficulty = ?,
           explanation = ?
       WHERE question_id = ?`,
      [
        item.question_text,
        item.option_a,
        item.option_b,
        item.option_c,
        item.option_d,
        item.correct_option,
        item.difficulty,
        item.explanation,
        item.id
      ]
    );

    if (result.affectedRows > 0) {
      updated++;
    } else {
      console.warn(`Warning: Question ID ${item.id} not found in database.`);
    }
  }

  console.log(`Successfully replaced ${updated} out of ${replacements.length} definition-only aptitude questions!`);

  // Verify duplicates
  const [dupRows] = await db.promise().query(`
    SELECT question_text, COUNT(*) as cnt
    FROM aptitude_practice_questions
    GROUP BY question_text
    HAVING cnt > 1
  `);

  console.log(`Duplicate question_text check count: ${dupRows.length}`);
  if (dupRows.length > 0) {
    console.error('Duplicates detected:', dupRows);
  } else {
    console.log('Zero duplicates found across aptitude practice question bank!');
  }

  // Distribution check
  const [distRows] = await db.promise().query(`
    SELECT c.name as category,
           COUNT(*) as total,
           SUM(CASE WHEN q.question_text LIKE '%Which pair%' OR q.question_text LIKE '%definition%' OR q.question_text LIKE '%concept%' THEN 1 ELSE 0 END) as theoretical,
           SUM(CASE WHEN q.question_text REGEXP '[0-9]' AND q.question_text NOT LIKE '%Which pair%' THEN 1 ELSE 0 END) as numerical_calculation,
           SUM(CASE WHEN q.question_text NOT REGEXP '[0-9]' AND q.question_text NOT LIKE '%Which pair%' AND q.question_text NOT LIKE '%definition%' THEN 1 ELSE 0 END) as reasoning_application
    FROM aptitude_practice_questions q
    JOIN aptitude_topics t ON t.topic_id = q.topic_id
    JOIN aptitude_categories c ON c.category_id = t.category_id
    GROUP BY c.name
  `);

  console.log('\nFinal Distribution across Categories:');
  console.table(distRows);

  process.exit(0);
}

updateAptitudeBank().catch(err => {
  console.error('Error updating aptitude bank:', err);
  process.exit(1);
});
