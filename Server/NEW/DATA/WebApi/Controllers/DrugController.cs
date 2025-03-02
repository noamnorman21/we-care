﻿using DATA;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace WebApi.Controllers
{
    [RoutePrefix("api/Drug")] //get all drugs for show in search
    public class DrugController : ApiController
    {
        igroup194DB db = new igroup194DB();
         
        [HttpGet]
        [Route("GetAllDrugs")]
        public IHttpActionResult GetAllDrugs()
        {
            try
            {
                var drugs = from d in db.tblDrug
                            select new
                            {
                                drugId = d.drugId,
                                drugName = d.drugName,
                                drugNameEn = d.drugNameEn,
                                drugUrlEn = d.drugUrlEn,
                                drugUrl = d.drugUrl,
                                modifyDate = d.modifyDate,
                                Type = d.Type,
                            };
                drugs.OrderBy(x => x.drugNameEn);
                return Ok(drugs);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}